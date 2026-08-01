import { createClient } from '@/lib/shared/utils/supabase/server';
import { DeThi, CauHoiThiThu, KetQuaThiThu } from '../types';

export async function taoDeThi(chuyenDeId: string): Promise<DeThi | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Lấy câu hỏi từ view public
  const { data, error } = await supabase
    .from('cau_hoi_public')
    .select('id, noi_dung, cac_lua_chon')
    .eq('chuyen_de_id', chuyenDeId)
    .overlaps('phan_loai', [1, 2, 3]);

  if (error || !data || data.length === 0) {
    console.error('Lỗi khi lấy câu hỏi tạo đề thi, hoặc không có câu hỏi Thi thử:', error);
    return null;
  }

  // Shuffle mảng và lấy tối đa 20 câu
  const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 20);

  // Sinh phienThiId logic
  const phienThiId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `session-${Date.now()}`;

  return {
    phienThiId,
    chuyenDeId,
    cauHoi: shuffled as CauHoiThiThu[],
    thoiGianLamBai: 30 * 60, // 30 phút = 1800 giây
  };
}

export async function getLichSuThiThu(): Promise<KetQuaThiThu[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await supabase
    .from('ket_qua_thi')
    .select(`
      id,
      diem_so,
      thoi_gian_hoan_thanh,
      ngay_thi,
      chi_tiet_bai_lam,
      chuyen_de:danh_muc_chuyen_de (ten)
    `)
    .eq('hoc_vien_id', user.id)
    .eq('loai_bai', 'thi_thu')
    .order('ngay_thi', { ascending: false });

  if (error) {
    console.error('Lỗi khi lấy lịch sử thi thử:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    diem_so: item.diem_so,
    thoi_gian_hoan_thanh: item.thoi_gian_hoan_thanh,
    ngay_thi: item.ngay_thi,
    chi_tiet_bai_lam: item.chi_tiet_bai_lam,
    chuyen_de_ten: item.chuyen_de?.ten,
  })) as KetQuaThiThu[];
}
