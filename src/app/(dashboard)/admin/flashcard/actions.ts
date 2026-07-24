'use server'

import { createClient } from '@/lib/shared/utils/supabase/server'

export async function importFlashcards(data: { chuyenDeId: string, cards: { mat_truoc: string, mat_sau: string }[] }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  // Insert cards
  const { error } = await supabase
    .from('flashcard')
    .insert(
      data.cards.map(c => ({
        chuyen_de_id: data.chuyenDeId,
        mat_truoc: c.mat_truoc,
        mat_sau: c.mat_sau
      }))
    );

  if (error) {
    console.error("Lỗi thêm flashcard:", error);
    throw new Error(error.message);
  }

  return { success: true, total: data.cards.length };
}
