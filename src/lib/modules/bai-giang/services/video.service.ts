import { createClient } from '@/lib/shared/utils/supabase/server';
import { BaiGiangVideo } from '../types';

export async function getDanhSachVideo(chuyenDeId?: string): Promise<BaiGiangVideo[]> {
  const supabase = await createClient();
  let query = supabase.from('bai_giang_video').select('*');
  
  if (chuyenDeId) {
    query = query.eq('chuyen_de_id', chuyenDeId);
  }

  const { data, error } = await query.order('thu_tu', { ascending: true });

  if (error) {
    console.error('Lỗi khi lấy danh sách video:', error);
    return [];
  }

  return data || [];
}
