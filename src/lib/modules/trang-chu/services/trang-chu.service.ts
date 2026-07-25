import { createClient } from '@/lib/shared/utils/supabase/server';

export async function getPublicStats() {
  const supabase = await createClient();

  // Chạy các query đếm song song để tối ưu hiệu suất
  const [
    { count: videoCount },
    { count: lyThuyetCount },
    { count: cauHoiCount },
    { count: flashcardCount }
  ] = await Promise.all([
    supabase.from('bai_giang_video').select('*', { count: 'exact', head: true }),
    supabase.from('bai_giang_ly_thuyet').select('*', { count: 'exact', head: true }),
    supabase.from('cau_hoi').select('*', { count: 'exact', head: true }),
    supabase.from('flashcard').select('*', { count: 'exact', head: true })
  ]);

  return {
    videoCount: videoCount || 0,
    lyThuyetCount: lyThuyetCount || 0,
    cauHoiCount: cauHoiCount || 0,
    flashcardCount: flashcardCount || 0,
    tongBaiGiang: (videoCount || 0) + (lyThuyetCount || 0)
  };
}
