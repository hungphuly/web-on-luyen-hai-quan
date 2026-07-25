'use server'

import { createClient } from '@/lib/shared/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// --- VIDEO ACTIONS ---

export async function createVideo(formData: FormData) {
  const supabase = await createClient();
  
  const tieu_de = formData.get('tieu_de') as string;
  const mo_ta = formData.get('mo_ta') as string;
  const youtube_id = formData.get('youtube_id') as string;
  const chuyen_de_id = formData.get('chuyen_de_id') as string;
  const thu_tu = parseInt(formData.get('thu_tu') as string) || 0;
  
  if (!tieu_de || !youtube_id || !chuyen_de_id) {
    return { error: 'Tiêu đề, ID Youtube và Chuyên đề không được để trống' };
  }

  const { error } = await supabase
    .from('bai_giang_video')
    .insert({ tieu_de, mo_ta, youtube_id, chuyen_de_id, thu_tu });

  if (error) return { error: error.message };

  revalidatePath('/admin/bai-giang');
  revalidatePath('/bai-giang');
  return { success: true };
}

export async function updateVideo(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const tieu_de = formData.get('tieu_de') as string;
  const mo_ta = formData.get('mo_ta') as string;
  const youtube_id = formData.get('youtube_id') as string;
  const chuyen_de_id = formData.get('chuyen_de_id') as string;
  const thu_tu = parseInt(formData.get('thu_tu') as string) || 0;
  
  if (!tieu_de || !youtube_id || !chuyen_de_id) {
    return { error: 'Tiêu đề, ID Youtube và Chuyên đề không được để trống' };
  }

  const { error } = await supabase
    .from('bai_giang_video')
    .update({ tieu_de, mo_ta, youtube_id, chuyen_de_id, thu_tu })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/bai-giang');
  revalidatePath('/bai-giang');
  return { success: true };
}

export async function deleteVideo(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('bai_giang_video')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/bai-giang');
  revalidatePath('/bai-giang');
  return { success: true };
}

// --- LY THUYET ACTIONS ---

export async function createLyThuyet(formData: FormData) {
  const supabase = await createClient();
  
  const tieu_de = formData.get('tieu_de') as string;
  const noi_dung_markdown = formData.get('noi_dung_markdown') as string;
  const hinh_anh_url = formData.get('hinh_anh_url') as string;
  const chuyen_de_id = formData.get('chuyen_de_id') as string;
  const thu_tu = parseInt(formData.get('thu_tu') as string) || 0;
  
  if (!tieu_de || !noi_dung_markdown || !chuyen_de_id) {
    return { error: 'Tiêu đề, Nội dung và Chuyên đề không được để trống' };
  }

  const { error } = await supabase
    .from('bai_giang_ly_thuyet')
    .insert({ tieu_de, noi_dung_markdown, hinh_anh_url, chuyen_de_id, thu_tu });

  if (error) return { error: error.message };

  revalidatePath('/admin/bai-giang');
  revalidatePath('/bai-giang');
  return { success: true };
}

export async function updateLyThuyet(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const tieu_de = formData.get('tieu_de') as string;
  const noi_dung_markdown = formData.get('noi_dung_markdown') as string;
  const hinh_anh_url = formData.get('hinh_anh_url') as string;
  const chuyen_de_id = formData.get('chuyen_de_id') as string;
  const thu_tu = parseInt(formData.get('thu_tu') as string) || 0;
  
  if (!tieu_de || !noi_dung_markdown || !chuyen_de_id) {
    return { error: 'Tiêu đề, Nội dung và Chuyên đề không được để trống' };
  }

  const { error } = await supabase
    .from('bai_giang_ly_thuyet')
    .update({ tieu_de, noi_dung_markdown, hinh_anh_url, chuyen_de_id, thu_tu })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/bai-giang');
  revalidatePath('/bai-giang');
  return { success: true };
}

export async function deleteLyThuyet(id: string) {
  const supabase = await createClient();
  
  // Xóa tiến độ liên quan trước
  await supabase.from('tien_do_hoc_lieu').delete().eq('bai_ly_thuyet_id', id);

  const { error } = await supabase
    .from('bai_giang_ly_thuyet')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/bai-giang');
  revalidatePath('/bai-giang');
  return { success: true };
}
