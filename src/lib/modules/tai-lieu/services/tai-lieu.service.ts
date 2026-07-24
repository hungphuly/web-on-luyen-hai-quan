'use server'

import { createClient } from '@/lib/shared/utils/supabase/server';

export interface TaiLieuFilter {
  search?: string;
  trangThai?: 'Tất cả' | 'Còn hiệu lực' | 'Hết hiệu lực';
}

export async function getDanhSachTaiLieu(filter: TaiLieuFilter = {}) {
  const supabase = await createClient();

  let query = supabase
    .from('van_ban_phap_luat')
    .select('*')
    .order('ngay_ban_hanh', { ascending: false, nullsFirst: false });

  if (filter.search && filter.search.trim() !== '') {
    // Tìm kiếm ILIKE theo ten_van_ban hoặc so_hieu
    const searchTerm = `%${filter.search.trim()}%`;
    query = query.or(`ten_van_ban.ilike.${searchTerm},so_hieu.ilike.${searchTerm}`);
  }

  if (filter.trangThai && filter.trangThai !== 'Tất cả') {
    query = query.eq('trang_thai', filter.trangThai);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Lỗi khi lấy danh sách văn bản:', error);
    return [];
  }

  return data;
}
