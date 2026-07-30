import { createClient } from '@/lib/shared/utils/supabase/server';
import { BaiGiangVideo, VideoTienDo } from '../types';

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

export async function getVideoTienDoList(): Promise<VideoTienDo[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('video_tien_do')
    .select('*')
    .eq('hoc_vien_id', user.id);

  if (error) {
    console.error('Lỗi khi lấy tiến độ video:', error);
    return [];
  }
  return data || [];
}
