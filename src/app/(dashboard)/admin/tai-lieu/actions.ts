'use server'

import { createClient } from '@/lib/shared/utils/supabase/server'

export async function uploadVanBanPhapLuat(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  const file = formData.get('file') as File;
  const ten_van_ban = formData.get('ten_van_ban') as string;
  const so_hieu = formData.get('so_hieu') as string;
  const ngay_ban_hanh = formData.get('ngay_ban_hanh') as string;
  const ngay_het_hieu_luc = formData.get('ngay_het_hieu_luc') as string;
  const trang_thai = formData.get('trang_thai') as string;

  if (!ten_van_ban || !file) {
    throw new Error('Vui lòng nhập tên văn bản và chọn file');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('tai_lieu_phap_luat')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Upload lỗi:', uploadError);
    throw new Error('Lỗi upload file: ' + uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('tai_lieu_phap_luat')
    .getPublicUrl(fileName);

  // Insert to DB
  const { error: insertError } = await supabase
    .from('van_ban_phap_luat')
    .insert({
      ten_van_ban,
      so_hieu: so_hieu || null,
      ngay_ban_hanh: ngay_ban_hanh || null,
      ngay_het_hieu_luc: ngay_het_hieu_luc || null,
      trang_thai: trang_thai || 'Còn hiệu lực',
      file_url: publicUrlData.publicUrl
    });

  if (insertError) {
    throw new Error('Lỗi lưu thông tin văn bản: ' + insertError.message);
  }

  return { success: true };
}

export async function updateTaiLieu(id: string, data: { trang_thai: string, ngay_het_hieu_luc: string | null }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  // Chú ý: Ở frontend chỉ kiểm tra admin dựa vào UI (chặn route, menu),
  // ở DB policy đã check role admin nên ta có thể gọi lệnh update luôn.
  const { error } = await supabase
    .from('van_ban_phap_luat')
    .update({
      trang_thai: data.trang_thai,
      ngay_het_hieu_luc: data.ngay_het_hieu_luc || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Lỗi update:', error);
    throw new Error('Cập nhật thất bại: ' + error.message);
  }

  return { success: true };
}
