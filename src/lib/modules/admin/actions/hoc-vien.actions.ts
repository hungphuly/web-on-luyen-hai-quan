'use server';

import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server';

async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not found');

  const { data: hocVien } = await supabase
    .from('hoc_vien')
    .select('loai_tai_khoan')
    .eq('id', user.id)
    .single();

  if (hocVien?.loai_tai_khoan !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

export type HocVienData = {
  id: string;
  email: string;
  ho_ten: string;
  loai_tai_khoan: string;
  vip_het_han: string | null;
  created_at: string;
  phan_loai: 'Mới' | 'Cũ';
  tong_donate: number;
};

export async function getDanhSachHocVien(params: {
  page: number;
  limit: number;
  search?: string;
  isNew?: 'all' | 'new' | 'old';
  isDonated?: 'all' | 'donated' | 'not_donated';
}) {
  await checkAdminAuth();

  const adminSupabase = await createAdminClient();

  let query = adminSupabase.from('hoc_vien').select('*, ung_ho(so_tien, trang_thai)', { count: 'exact' });

  // 1. Filter Search
  if (params.search) {
    query = query.or(`ho_ten.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }

  // 2. Filter New/Old (30 days)
  if (params.isNew && params.isNew !== 'all') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isoString = thirtyDaysAgo.toISOString();
    
    if (params.isNew === 'new') {
      query = query.gte('created_at', isoString);
    } else {
      query = query.lt('created_at', isoString);
    }
  }

  // 3. Filter Donated
  if (params.isDonated && params.isDonated !== 'all') {
    const { data: donatedIdsData } = await adminSupabase
      .from('ung_ho')
      .select('hoc_vien_id')
      .eq('trang_thai', 'thanh_cong')
      .not('hoc_vien_id', 'is', null);
      
    const donatedIds = Array.from(new Set(donatedIdsData?.map(d => d.hoc_vien_id) || []));

    if (params.isDonated === 'donated') {
      if (donatedIds.length > 0) {
        query = query.in('id', donatedIds);
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    } else if (params.isDonated === 'not_donated') {
      if (donatedIds.length > 0) {
        query = query.not('id', 'in', `(${donatedIds.join(',')})`);
      }
    }
  }

  // 4. Pagination & Sorting
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching hoc_vien:', error);
    throw new Error('Failed to fetch data');
  }

  // Transform data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const processedData: HocVienData[] = (data || []).map(row => {
    const createdAt = new Date(row.created_at);
    const isNew = createdAt >= thirtyDaysAgo;
    
    // Tính tổng tiền từ bảng ung_ho
    const ungHoList = row.ung_ho || [];
    const successfulUngHo = ungHoList.filter((u: any) => u.trang_thai === 'thanh_cong');
    const tongDonate = successfulUngHo.reduce((sum: number, current: any) => sum + Number(current.so_tien || 0), 0);

    return {
      id: row.id,
      email: row.email,
      ho_ten: row.ho_ten,
      loai_tai_khoan: row.loai_tai_khoan,
      vip_het_han: row.vip_het_han,
      created_at: row.created_at,
      phan_loai: isNew ? 'Mới' : 'Cũ',
      tong_donate: tongDonate
    };
  });

  return {
    data: processedData,
    total: count || 0
  };
}

export async function getAllHocVienForExport(params: {
  search?: string;
  isNew?: 'all' | 'new' | 'old';
  isDonated?: 'all' | 'donated' | 'not_donated';
}) {
  await checkAdminAuth();

  const adminSupabase = await createAdminClient();

  let query = adminSupabase.from('hoc_vien').select('*, ung_ho(so_tien, trang_thai)');

  if (params.search) {
    query = query.or(`ho_ten.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }

  if (params.isNew && params.isNew !== 'all') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isoString = thirtyDaysAgo.toISOString();
    
    if (params.isNew === 'new') {
      query = query.gte('created_at', isoString);
    } else {
      query = query.lt('created_at', isoString);
    }
  }

  if (params.isDonated && params.isDonated !== 'all') {
    const { data: donatedIdsData } = await adminSupabase
      .from('ung_ho')
      .select('hoc_vien_id')
      .eq('trang_thai', 'thanh_cong')
      .not('hoc_vien_id', 'is', null);
      
    const donatedIds = Array.from(new Set(donatedIdsData?.map(d => d.hoc_vien_id) || []));

    if (params.isDonated === 'donated') {
      if (donatedIds.length > 0) {
        query = query.in('id', donatedIds);
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    } else if (params.isDonated === 'not_donated') {
      if (donatedIds.length > 0) {
        query = query.not('id', 'in', `(${donatedIds.join(',')})`);
      }
    }
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error exporting hoc_vien:', error);
    throw new Error('Failed to fetch data for export');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const processedData: HocVienData[] = (data || []).map(row => {
    const createdAt = new Date(row.created_at);
    const isNew = createdAt >= thirtyDaysAgo;
    
    const ungHoList = row.ung_ho || [];
    const successfulUngHo = ungHoList.filter((u: any) => u.trang_thai === 'thanh_cong');
    const tongDonate = successfulUngHo.reduce((sum: number, current: any) => sum + Number(current.so_tien || 0), 0);

    return {
      id: row.id,
      email: row.email,
      ho_ten: row.ho_ten,
      loai_tai_khoan: row.loai_tai_khoan,
      vip_het_han: row.vip_het_han,
      created_at: row.created_at,
      phan_loai: isNew ? 'Mới' : 'Cũ',
      tong_donate: tongDonate
    };
  });

  return processedData;
}
