'use server'

import { createClient } from '@/lib/shared/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markLessonComplete(baiLyThuyetId: string, slug: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Chưa đăng nhập')
  }

  const { error } = await supabase
    .from('tien_do_hoc_lieu')
    .upsert(
      {
        hoc_vien_id: user.id,
        bai_ly_thuyet_id: baiLyThuyetId,
        da_hoan_thanh: true,
        ngay_hoan_thanh: new Date().toISOString()
      },
      { onConflict: 'hoc_vien_id,bai_ly_thuyet_id' }
    )

  if (error) {
    console.error('Lỗi khi đánh dấu hoàn thành bài học:', error)
    throw new Error('Không thể cập nhật tiến độ')
  }

  // Revalidate trang chuyên đề để cập nhật UI
  revalidatePath(`/bai-giang/${slug}`)
}

export async function updateVideoProgress(videoId: string, slug: string, percentage: number) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Chưa đăng nhập')
  }

  // Lấy tiến độ hiện tại để không bị lùi % nếu người dùng xem lại
  const { data: currentProgress } = await supabase
    .from('video_tien_do')
    .select('phan_tram_da_xem, da_hoan_thanh')
    .eq('hoc_vien_id', user.id)
    .eq('bai_giang_video_id', videoId)
    .single()

  const maxPercentage = currentProgress 
    ? Math.max(currentProgress.phan_tram_da_xem, percentage)
    : percentage

  const isCompleted = currentProgress?.da_hoan_thanh || maxPercentage >= 90

  const { error } = await supabase
    .from('video_tien_do')
    .upsert(
      {
        hoc_vien_id: user.id,
        bai_giang_video_id: videoId,
        phan_tram_da_xem: maxPercentage,
        da_hoan_thanh: isCompleted
      },
      { onConflict: 'hoc_vien_id,bai_giang_video_id' }
    )

  if (error) {
    console.error('Lỗi khi cập nhật tiến độ video:', error)
    throw new Error('Không thể cập nhật tiến độ video')
  }

  if (isCompleted && !currentProgress?.da_hoan_thanh) {
    // Chỉ revalidate khi vừa mới hoàn thành để tránh spam revalidate
    revalidatePath(`/bai-giang/${slug}`)
  }
}
