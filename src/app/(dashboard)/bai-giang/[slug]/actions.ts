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
