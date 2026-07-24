import { createClient } from '@/lib/shared/utils/supabase/server';
import { Flashcard, FlashcardTienDo } from '../types';
import { DanhMucChuyenDe } from '@/lib/modules/bai-giang/types';

export async function getDanhSachChuyenDeFlashcard(): Promise<(DanhMucChuyenDe & { due_count: number })[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Lấy tất cả chuyên đề kèm số lượng flashcard
  const { data: danhMuc, error: cdError } = await supabase
    .from('danh_muc_chuyen_de')
    .select(`*, flashcard (id)`)
    .order('thu_tu', { ascending: true });

  if (cdError) {
    console.error('Lỗi khi lấy danh mục flashcard:', cdError);
    return [];
  }

  // Lấy tiến độ của user hiện tại
  const { data: tienDoList, error: tdError } = await supabase
    .from('flashcard_tien_do')
    .select('flashcard_id, ngay_on_lai_tiep_theo')
    .eq('hoc_vien_id', user.id);

  if (tdError) {
    console.error('Lỗi khi lấy tiến độ flashcard:', tdError);
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tạo map để tra cứu tiến độ nhanh: flashcard_id -> ngay_on_lai
  const tienDoMap = new Map<string, Date>();
  tienDoList?.forEach(td => {
    tienDoMap.set(td.flashcard_id, new Date(td.ngay_on_lai_tiep_theo));
  });

  return (danhMuc || []).map(cd => {
    const flashcards = cd.flashcard || [];
    let dueCount = 0;

    flashcards.forEach((fc: any) => {
      const nextDate = tienDoMap.get(fc.id);
      // Nếu chưa có tiến độ (nextDate undefined) HOẶC nextDate <= today thì tính là đến hạn
      if (!nextDate || nextDate <= today) {
        dueCount++;
      }
    });

    return {
      ...cd,
      due_count: dueCount
    };
  }).filter(cd => cd.flashcard && cd.flashcard.length > 0);
}

export async function getFlashcardsDenHan(chuyenDeId: string): Promise<Flashcard[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Lấy tất cả flashcard của chuyên đề
  const { data: flashcards, error: fcError } = await supabase
    .from('flashcard')
    .select('*')
    .eq('chuyen_de_id', chuyenDeId);

  if (fcError) return [];

  // Lấy tiến độ của user
  const { data: tienDoList, error: tdError } = await supabase
    .from('flashcard_tien_do')
    .select('flashcard_id, ngay_on_lai_tiep_theo')
    .eq('hoc_vien_id', user.id);

  if (tdError) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tienDoMap = new Map<string, Date>();
  tienDoList?.forEach(td => {
    tienDoMap.set(td.flashcard_id, new Date(td.ngay_on_lai_tiep_theo));
  });

  // Lọc lấy các thẻ đến hạn
  const dueFlashcards = (flashcards || []).filter(fc => {
    const nextDate = tienDoMap.get(fc.id);
    return !nextDate || nextDate <= today;
  });

  // Xáo trộn nhẹ để thứ tự ngẫu nhiên
  return dueFlashcards.sort(() => Math.random() - 0.5);
}
