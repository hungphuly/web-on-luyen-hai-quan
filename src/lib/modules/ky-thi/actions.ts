'use server';

import { createClient } from '@/lib/shared/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { KyThi, KyThiPhienLamBai } from './types';

export async function getOrCreateKyThiSession(kyThiId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Get ky thi info
  const { data: kyThi } = await supabase.from('ky_thi').select('*').eq('id', kyThiId).single();
  if (!kyThi || kyThi.trang_thai !== 'active') return { error: 'Kỳ thi không tồn tại hoặc đã đóng.' };

  const now = new Date();
  if (kyThi.thoi_gian_bat_dau && new Date(kyThi.thoi_gian_bat_dau) > now) {
    return { error: 'Kỳ thi chưa bắt đầu.' };
  }
  if (kyThi.thoi_gian_ket_thuc && new Date(kyThi.thoi_gian_ket_thuc) < now) {
    return { error: 'Kỳ thi đã kết thúc.' };
  }

  if (kyThi.doi_tuong_thi?.type === 'emails') {
    const { data: hocVien } = await supabase.from('hoc_vien').select('email').eq('id', user.id).single();
    if (!hocVien || !kyThi.doi_tuong_thi.emails.includes(hocVien.email)) {
      return { error: 'Bạn không thuộc danh sách đối tượng được thi.' };
    }
  }

  // Check existing session
  const { data: existingSession } = await supabase
    .from('ky_thi_phien_lam_bai')
    .select('*')
    .eq('ky_thi_id', kyThiId)
    .eq('hoc_vien_id', user.id)
    .single();

  if (existingSession) {
    // Session exists (can be dang_thi or da_nop)
    return { session: existingSession as KyThiPhienLamBai, kyThi: kyThi as KyThi };
  }

  // Create new session
  // 1. Get questions
  let query = supabase.from('cau_hoi_public').select('*');
  
  if (kyThi.phan_loai_cau_hoi && kyThi.phan_loai_cau_hoi.length > 0) {
    query = query.overlaps('phan_loai', kyThi.phan_loai_cau_hoi);
  } else {
    query = query.contains('phan_loai', [3]); // Fallback
  }
  
  if (kyThi.cau_hinh_chuyen_de && kyThi.cau_hinh_chuyen_de.length > 0) {
    query = query.in('chuyen_de_id', kyThi.cau_hinh_chuyen_de);
  }

  const { data: allQuestions } = await query;
  
  if (!allQuestions || allQuestions.length === 0) {
    return { error: 'Không có câu hỏi nào thỏa mãn cấu hình kỳ thi này.' };
  }

  // Shuffle and pick
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, kyThi.so_luong_cau_hoi);

  // Remove correct answers from client payload for security
  const danh_sach_cau_hoi = selected.map(q => ({
    id: q.id,
    noi_dung: q.noi_dung,
    cac_lua_chon: q.cac_lua_chon,
    chuyen_de_id: q.chuyen_de_id
    // NOT including dap_an_dung
  }));

  const { data: newSession, error: createError } = await supabase
    .from('ky_thi_phien_lam_bai')
    .insert([{
      ky_thi_id: kyThiId,
      hoc_vien_id: user.id,
      danh_sach_cau_hoi,
      bai_lam_tam_thoi: {},
      bat_dau_luc: new Date().toISOString()
    }])
    .select('*')
    .single();

  if (createError) return { error: createError.message };

  return { session: newSession as KyThiPhienLamBai, kyThi: kyThi as KyThi };
}

export async function saveKyThiAnswer(kyThiId: string, cauHoiId: string, answer: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Fetch session
  const { data: session } = await supabase
    .from('ky_thi_phien_lam_bai')
    .select('id, bai_lam_tam_thoi, trang_thai')
    .eq('ky_thi_id', kyThiId)
    .eq('hoc_vien_id', user.id)
    .single();

  if (!session || session.trang_thai === 'da_nop') return { error: 'Không thể lưu bài' };

  const bai_lam = session.bai_lam_tam_thoi || {};
  bai_lam[cauHoiId] = answer;

  await supabase
    .from('ky_thi_phien_lam_bai')
    .update({ bai_lam_tam_thoi: bai_lam })
    .eq('id', session.id);

  return { success: true };
}

export async function submitKyThi(kyThiId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Fetch session and kyThi
  const { data: session } = await supabase
    .from('ky_thi_phien_lam_bai')
    .select('*')
    .eq('ky_thi_id', kyThiId)
    .eq('hoc_vien_id', user.id)
    .single();

  if (!session) return { error: 'Session not found' };
  if (session.trang_thai === 'da_nop') return { success: true }; // Already submitted

  const { data: kyThi } = await supabase.from('ky_thi').select('so_luong_cau_hoi').eq('id', kyThiId).single();
  if (!kyThi) return { error: 'KyThi not found' };

  // Grade the exam
  // We need to fetch the real answers from the DB
  const questionIds = (session.danh_sach_cau_hoi as any[]).map(q => q.id);
  const { data: dbQuestions } = await supabase
    .from('cau_hoi')
    .select('id, dap_an_dung')
    .in('id', questionIds);

  const answerMap = new Map(dbQuestions?.map(q => [q.id, q.dap_an_dung]));
  const bai_lam = session.bai_lam_tam_thoi || {};

  let soCauDung = 0;
  const ket_qua_chi_tiet: any = {}; // map of id => { selected, isCorrect } (do NOT send correct answer)

  (session.danh_sach_cau_hoi as any[]).forEach(q => {
    const selected = bai_lam[q.id];
    const correct = answerMap.get(q.id);
    const isCorrect = selected === correct;
    if (isCorrect) soCauDung++;
    
    ket_qua_chi_tiet[q.id] = {
      selected: selected || null,
      isCorrect
    };
  });

  const diem_so = parseFloat(((soCauDung / kyThi.so_luong_cau_hoi) * 10).toFixed(2));

  await supabase
    .from('ky_thi_phien_lam_bai')
    .update({
      trang_thai: 'da_nop',
      ket_thuc_luc: new Date().toISOString(),
      ket_qua: ket_qua_chi_tiet,
      diem_so
    })
    .eq('id', session.id);

  revalidatePath('/ky-thi');
  revalidatePath(`/ky-thi/${kyThiId}`);

  return { success: true };
}
