'use server'

import { createClient } from '@/lib/shared/utils/supabase/server'
import { revalidatePath } from 'next/cache';

export async function ghiNhanTienDoFlashcard(flashcardId: string, nho: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Bạn cần đăng nhập để học flashcard');
  }

  // Lấy tiến độ hiện tại
  const { data: tienDo } = await supabase
    .from('flashcard_tien_do')
    .select('hop_so')
    .eq('hoc_vien_id', user.id)
    .eq('flashcard_id', flashcardId)
    .single();

  let hopSoMoi = 1;

  if (nho) {
    // Tăng hộp số (tối đa 5)
    hopSoMoi = tienDo ? Math.min(tienDo.hop_so + 1, 5) : 2;
  } else {
    // Quên thì về hộp 1
    hopSoMoi = 1;
  }

  // Tính ngày ôn lại theo hộp số
  const ngayOnLai = new Date();
  if (hopSoMoi === 1) ngayOnLai.setDate(ngayOnLai.getDate() + 1); // mai
  else if (hopSoMoi === 2) ngayOnLai.setDate(ngayOnLai.getDate() + 3);
  else if (hopSoMoi === 3) ngayOnLai.setDate(ngayOnLai.getDate() + 7);
  else if (hopSoMoi === 4) ngayOnLai.setDate(ngayOnLai.getDate() + 14);
  else ngayOnLai.setDate(ngayOnLai.getDate() + 30); // hộp 5

  const { error } = await supabase
    .from('flashcard_tien_do')
    .upsert(
      {
        hoc_vien_id: user.id,
        flashcard_id: flashcardId,
        hop_so: hopSoMoi,
        ngay_on_lai_tiep_theo: ngayOnLai.toISOString().split('T')[0] // định dạng YYYY-MM-DD
      },
      { onConflict: 'hoc_vien_id, flashcard_id' } // Dựa trên constraint unique
    );

  if (error) {
    console.error('Lỗi khi lưu tiến độ flashcard:', error);
    throw new Error('Không thể lưu tiến độ');
  }

  return { success: true };
}
