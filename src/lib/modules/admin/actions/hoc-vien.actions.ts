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
  last_activity: string | null;
};

export async function getDanhSachHocVien(params: {
  page: number;
  limit: number;
  search?: string;
  isNew?: 'all' | 'new' | 'old';
  isDonated?: 'all' | 'donated' | 'not_donated';
  isStudying?: 'all' | 'studying' | 'lazy';
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

  // 3.5 Filter Chăm học (Studying in last 7 days)
  if (params.isStudying && params.isStudying !== 'all') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isoString7 = sevenDaysAgo.toISOString();

    const [ { data: activeOnLuyen }, { data: activeThi } ] = await Promise.all([
      adminSupabase.from('phien_on_luyen').select('hoc_vien_id').gte('ngay_lam', isoString7),
      adminSupabase.from('ket_qua_thi').select('hoc_vien_id').gte('ngay_thi', isoString7)
    ]);
    const activeIds = Array.from(new Set([
      ...(activeOnLuyen?.map(d => d.hoc_vien_id) || []),
      ...(activeThi?.map(d => d.hoc_vien_id) || [])
    ]));

    if (params.isStudying === 'studying') {
      if (activeIds.length > 0) {
        query = query.in('id', activeIds);
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    } else if (params.isStudying === 'lazy') {
      if (activeIds.length > 0) {
        query = query.not('id', 'in', `(${activeIds.join(',')})`);
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

  // Lấy thêm Last Activity cho các User này
  const displayedUserIds = (data || []).map(r => r.id);
  const [ { data: lastOnLuyen }, { data: lastThi } ] = await Promise.all([
    adminSupabase.from('phien_on_luyen').select('hoc_vien_id, ngay_lam').in('hoc_vien_id', displayedUserIds),
    adminSupabase.from('ket_qua_thi').select('hoc_vien_id, ngay_thi').in('hoc_vien_id', displayedUserIds)
  ]);

  const activityMap = new Map<string, string>();
  [...(lastOnLuyen || []).map(o => ({ id: o.hoc_vien_id, time: o.ngay_lam })), 
   ...(lastThi || []).map(t => ({ id: t.hoc_vien_id, time: t.ngay_thi }))].forEach(act => {
    if (!act.time) return;
    const currentMax = activityMap.get(act.id);
    if (!currentMax || new Date(act.time) > new Date(currentMax)) {
      activityMap.set(act.id, act.time);
    }
  });

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
      tong_donate: tongDonate,
      last_activity: activityMap.get(row.id) || null
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
      tong_donate: tongDonate,
      last_activity: null
    };
  });

  return processedData;
}

export async function xoaHocVien(id: string) {
  await checkAdminAuth();
  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase.from('hoc_vien').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function adminDoiMatKhauHocVien(userId: string, newPassword: string) {
  await checkAdminAuth();
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự');
  }

  const adminSupabase = await createAdminClient();
  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (error) {
    console.error('Error updating user password:', error);
    throw new Error(error.message || 'Không thể đổi mật khẩu cho học viên');
  }

  return { success: true };
}

export async function getHocVienReport(hoc_vien_id: string) {
  await checkAdminAuth();
  const adminSupabase = await createAdminClient();

  const [
    { count: videoDone },
    { count: lyThuyetDone },
    { data: onLuyenData },
    { data: thiThuData },
    { data: thiThatData }
  ] = await Promise.all([
    adminSupabase.from('video_tien_do').select('*', { count: 'exact', head: true }).eq('hoc_vien_id', hoc_vien_id).eq('da_hoan_thanh', true),
    adminSupabase.from('tien_do_hoc_lieu').select('*', { count: 'exact', head: true }).eq('hoc_vien_id', hoc_vien_id).eq('da_hoan_thanh', true),
    adminSupabase.from('phien_on_luyen').select('so_cau_da_lam, so_cau_dung').eq('hoc_vien_id', hoc_vien_id),
    adminSupabase.from('ket_qua_thi').select('diem_so').eq('hoc_vien_id', hoc_vien_id).eq('loai_bai', 'thi_thu'),
    adminSupabase.from('ky_thi_phien_lam_bai').select('diem_so').eq('hoc_vien_id', hoc_vien_id).eq('trang_thai', 'da_nop')
  ]);

  // Ôn luyện
  const tongCauDaLam = (onLuyenData || []).reduce((sum, p) => sum + (p.so_cau_da_lam || 0), 0);
  const tongCauDung = (onLuyenData || []).reduce((sum, p) => sum + (p.so_cau_dung || 0), 0);
  const onLuyenTyLe = tongCauDaLam > 0 ? (tongCauDung / tongCauDaLam) * 100 : 0;

  // Thi thử
  const thiThuCount = thiThuData?.length || 0;
  const thiThuAvg = thiThuCount > 0 ? thiThuData!.reduce((sum, p) => sum + (p.diem_so || 0), 0) / thiThuCount : 0;

  // Thi thật
  const thiThatCount = thiThatData?.length || 0;
  const thiThatAvg = thiThatCount > 0 ? thiThatData!.reduce((sum, p) => sum + (p.diem_so || 0), 0) / thiThatCount : 0;

  return {
    hocLieu: {
      video: videoDone || 0,
      lyThuyet: lyThuyetDone || 0
    },
    onLuyen: {
      daLam: tongCauDaLam,
      dung: tongCauDung,
      tyLe: Math.round(onLuyenTyLe)
    },
    thiThu: {
      luotThi: thiThuCount,
      diemTrungBinh: Number(thiThuAvg.toFixed(2))
    },
    thiThat: {
      luotThi: thiThatCount,
      diemTrungBinh: Number(thiThatAvg.toFixed(2))
    }
  };
}
