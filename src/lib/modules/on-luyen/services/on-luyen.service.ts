import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server';
import { CauHoiPublic, PhienOnLuyen } from '../types';
import { DanhMucChuyenDe } from '@/lib/modules/bai-giang/types';

export async function getDanhSachChuyenDeCoCauHoi(): Promise<(DanhMucChuyenDe & { cau_hoi_count: number })[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('danh_muc_chuyen_de')
    .select(`
      *,
      cau_hoi (count)
    `)
    .order('thu_tu', { ascending: true });

  if (error) {
    console.error('Lỗi khi lấy danh sách chuyên đề ôn luyện:', error);
    return [];
  }

  return (data || []).map(cd => ({
    ...cd,
    cau_hoi_count: cd.cau_hoi?.[0]?.count || 0
  }));
}

export async function getDanhSachCauHoiPublic(chuyenDeId: string): Promise<CauHoiPublic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cau_hoi_public')
    .select('*')
    .eq('chuyen_de_id', chuyenDeId)
    .eq('phan_loai', 1);

  if (error) {
    console.error('Lỗi khi lấy danh sách câu hỏi public:', error);
    return [];
  }

  // Shuffle mảng để câu hỏi random một chút và lấy tối đa 20 câu mỗi phiên
  return (data || []).sort(() => Math.random() - 0.5).slice(0, 20) as CauHoiPublic[];
}

export async function getLichSuOnLuyen(): Promise<PhienOnLuyen[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await supabase
    .from('phien_on_luyen')
    .select(`
      *,
      chuyen_de:danh_muc_chuyen_de (ten)
    `)
    .eq('hoc_vien_id', user.id)
    .order('ngay_lam', { ascending: false });

  if (error) {
    console.error('Lỗi khi lấy lịch sử ôn luyện:', error);
    return [];
  }

  return data as unknown as PhienOnLuyen[];
}
