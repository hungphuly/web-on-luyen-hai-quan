'use server'

import { createClient } from '@/lib/shared/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper tạo slug từ tên
function generateSlug(ten: string) {
  return ten
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createChuyenDe(formData: FormData) {
  const supabase = await createClient();
  
  const ten = formData.get('ten') as string;
  const mo_ta = formData.get('mo_ta') as string;
  const thu_tu = parseInt(formData.get('thu_tu') as string) || 0;
  
  if (!ten) {
    return { error: 'Tên chuyên đề không được để trống' };
  }

  const slug = generateSlug(ten);

  const { error } = await supabase
    .from('danh_muc_chuyen_de')
    .insert({
      ten,
      slug,
      mo_ta,
      thu_tu
    });

  if (error) {
    console.error('Create Chuyen De error:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/chuyen-de');
  revalidatePath('/on-luyen');
  revalidatePath('/bai-giang');
  return { success: true };
}

export async function updateChuyenDe(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const ten = formData.get('ten') as string;
  const mo_ta = formData.get('mo_ta') as string;
  const thu_tu = parseInt(formData.get('thu_tu') as string) || 0;
  
  if (!ten) {
    return { error: 'Tên chuyên đề không được để trống' };
  }

  const slug = generateSlug(ten);

  const { error } = await supabase
    .from('danh_muc_chuyen_de')
    .update({
      ten,
      slug,
      mo_ta,
      thu_tu
    })
    .eq('id', id);

  if (error) {
    console.error('Update Chuyen De error:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/chuyen-de');
  revalidatePath('/on-luyen');
  revalidatePath('/bai-giang');
  return { success: true };
}

export async function deleteChuyenDe(id: string) {
  const supabase = await createClient();
  
  // 1. Kiểm tra khóa ngoại ở các bảng: cau_hoi, bai_giang_video, bai_giang_ly_thuyet, flashcard
  
  // Check cau_hoi
  const { count: cauHoiCount } = await supabase
    .from('cau_hoi')
    .select('id', { count: 'exact', head: true })
    .eq('chuyen_de_id', id);
    
  if (cauHoiCount && cauHoiCount > 0) {
    return { error: `Không thể xóa: Chuyên đề đang chứa ${cauHoiCount} câu hỏi.` };
  }

  // Check bai_giang_video
  const { count: videoCount } = await supabase
    .from('bai_giang_video')
    .select('id', { count: 'exact', head: true })
    .eq('chuyen_de_id', id);
    
  if (videoCount && videoCount > 0) {
    return { error: `Không thể xóa: Chuyên đề đang chứa ${videoCount} bài giảng video.` };
  }

  // Check bai_giang_ly_thuyet
  const { count: lyThuyetCount } = await supabase
    .from('bai_giang_ly_thuyet')
    .select('id', { count: 'exact', head: true })
    .eq('chuyen_de_id', id);
    
  if (lyThuyetCount && lyThuyetCount > 0) {
    return { error: `Không thể xóa: Chuyên đề đang chứa ${lyThuyetCount} bài giảng lý thuyết.` };
  }

  // Check flashcard
  const { count: flashcardCount } = await supabase
    .from('flashcard')
    .select('id', { count: 'exact', head: true })
    .eq('chuyen_de_id', id);
    
  if (flashcardCount && flashcardCount > 0) {
    return { error: `Không thể xóa: Chuyên đề đang chứa ${flashcardCount} flashcard.` };
  }

  // Nếu an toàn, tiến hành xóa
  const { error } = await supabase
    .from('danh_muc_chuyen_de')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete Chuyen De error:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/chuyen-de');
  revalidatePath('/on-luyen');
  revalidatePath('/bai-giang');
  return { success: true };
}
