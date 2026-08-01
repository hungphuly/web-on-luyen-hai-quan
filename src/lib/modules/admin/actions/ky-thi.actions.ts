'use server';

import { createClient } from '@/lib/shared/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { KyThi } from '../../ky-thi/types';

export async function getKyThiAdmin(): Promise<KyThi[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ky_thi')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ky_thi:', error);
    return [];
  }

  return data as KyThi[];
}

export async function upsertKyThi(id: string | null, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };
  const { data: hocVien } = await supabase.from('hoc_vien').select('loai_tai_khoan').eq('id', user.id).single();
  if (hocVien?.loai_tai_khoan !== 'admin') return { error: 'Forbidden' };

  const ten_ky_thi = formData.get('ten_ky_thi') as string;
  const mo_ta = formData.get('mo_ta') as string;
  const thoi_gian_lam_bai = parseInt(formData.get('thoi_gian_lam_bai') as string);
  const so_luong_cau_hoi = parseInt(formData.get('so_luong_cau_hoi') as string);
  const trang_thai = formData.get('trang_thai') as string;
  
  const chuyen_de_raw = formData.getAll('cau_hinh_chuyen_de');
  let cau_hinh_chuyen_de: string[] | null = null;
  // If 'all' is selected or nothing selected, we can set null (meaning all)
  if (!chuyen_de_raw.includes('all') && chuyen_de_raw.length > 0) {
    cau_hinh_chuyen_de = chuyen_de_raw as string[];
  }

  if (!ten_ky_thi || isNaN(thoi_gian_lam_bai) || isNaN(so_luong_cau_hoi)) {
    return { error: 'Vui lòng điền đầy đủ các trường bắt buộc' };
  }

  const phan_loai_raw = formData.getAll('phan_loai_cau_hoi');
  let phan_loai_cau_hoi = phan_loai_raw.map(v => parseInt(v as string)).filter(v => !isNaN(v));
  if (phan_loai_cau_hoi.length === 0) phan_loai_cau_hoi = [3]; // Default

  const tgbd = formData.get('thoi_gian_bat_dau') as string;
  const thoi_gian_bat_dau = tgbd ? new Date(tgbd).toISOString() : null;

  const tgkt = formData.get('thoi_gian_ket_thuc') as string;
  const thoi_gian_ket_thuc = tgkt ? new Date(tgkt).toISOString() : null;

  const doi_tuong_thi_type = formData.get('doi_tuong_thi_type') as string;
  let doi_tuong_thi: any = { type: 'all' };
  if (doi_tuong_thi_type === 'emails') {
    const emails_raw = formData.get('doi_tuong_thi_emails') as string;
    const emails = emails_raw ? emails_raw.split(',').map(e => e.trim()).filter(e => e) : [];
    doi_tuong_thi = { type: 'emails', emails };
  }

  const payload = {
    ten_ky_thi,
    mo_ta,
    thoi_gian_lam_bai,
    so_luong_cau_hoi,
    trang_thai,
    cau_hinh_chuyen_de,
    phan_loai_cau_hoi,
    thoi_gian_bat_dau,
    thoi_gian_ket_thuc,
    doi_tuong_thi
  };

  if (id) {
    const { error } = await supabase.from('ky_thi').update(payload).eq('id', id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from('ky_thi').insert([payload]);
    if (error) return { error: error.message };
  }

  revalidatePath('/admin/ky-thi');
  return { success: true };
}

export async function deleteKyThi(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };
  const { data: hocVien } = await supabase.from('hoc_vien').select('loai_tai_khoan').eq('id', user.id).single();
  if (hocVien?.loai_tai_khoan !== 'admin') return { error: 'Forbidden' };

  const { error } = await supabase.from('ky_thi').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/ky-thi');
  return { success: true };
}
