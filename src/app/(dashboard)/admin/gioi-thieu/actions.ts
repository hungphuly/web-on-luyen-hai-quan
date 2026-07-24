'use server'

import { createClient } from '@/lib/shared/utils/supabase/server'
import { revalidatePath } from 'next/cache';

export async function updateGioiThieu(data: { tieu_de: string, noi_dung: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  const { error } = await supabase
    .from('noi_dung_gioi_thieu')
    .insert({
      tieu_de: data.tieu_de,
      noi_dung_markdown: data.noi_dung
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/gioi-thieu');
  return { success: true };
}
