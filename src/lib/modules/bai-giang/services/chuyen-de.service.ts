import { createClient } from '@/lib/shared/utils/supabase/server';
import { ChuyenDeStats, DanhMucChuyenDe } from '../types';

export async function getDanhSachChuyenDe(): Promise<ChuyenDeStats[]> {
  const supabase = await createClient();
  
  // Lấy danh sách chuyên đề
  const { data: chuyenDeList, error: cdError } = await supabase
    .from('danh_muc_chuyen_de')
    .select('*')
    .order('thu_tu', { ascending: true });

  if (cdError || !chuyenDeList) {
    console.error('Lỗi khi lấy danh mục chuyên đề:', cdError);
    return [];
  }

  // Đếm video
  const { data: videoCountData } = await supabase
    .from('bai_giang_video')
    .select('chuyen_de_id', { count: 'exact' });

  // Đếm lý thuyết
  const { data: lyThuyetCountData } = await supabase
    .from('bai_giang_ly_thuyet')
    .select('chuyen_de_id', { count: 'exact' });

  // Gom nhóm count
  const videoCounts = videoCountData?.reduce((acc, curr) => {
    acc[curr.chuyen_de_id] = (acc[curr.chuyen_de_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const lyThuyetCounts = lyThuyetCountData?.reduce((acc, curr) => {
    acc[curr.chuyen_de_id] = (acc[curr.chuyen_de_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Map lại
  return chuyenDeList.map((cd) => ({
    ...cd,
    video_count: videoCounts[cd.id] || 0,
    ly_thuyet_count: lyThuyetCounts[cd.id] || 0,
  }));
}

export async function getChuyenDeBySlug(slug: string): Promise<DanhMucChuyenDe | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('danh_muc_chuyen_de')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Lỗi khi lấy chuyên đề by slug:', error);
    return null;
  }
  return data;
}
