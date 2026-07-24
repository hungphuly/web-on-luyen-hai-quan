import { createClient } from '@/lib/shared/utils/supabase/server';
import { BaiGiangLyThuyet, TienDoHocLieu } from '../types';

export async function getDanhSachLyThuyet(chuyenDeId?: string): Promise<BaiGiangLyThuyet[]> {
  const supabase = await createClient();
  let query = supabase.from('bai_giang_ly_thuyet').select('*');

  if (chuyenDeId) {
    query = query.eq('chuyen_de_id', chuyenDeId);
  }

  const { data, error } = await query.order('thu_tu', { ascending: true });

  if (error) {
    console.error('Lỗi khi lấy danh sách lý thuyết:', error);
    return [];
  }

  return data || [];
}

export async function getTienDoList(): Promise<TienDoHocLieu[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tien_do_hoc_lieu')
    .select('*')
    .eq('hoc_vien_id', user.id);

  if (error) {
    console.error('Lỗi khi lấy tiến độ:', error);
    return [];
  }
  return data || [];
}
