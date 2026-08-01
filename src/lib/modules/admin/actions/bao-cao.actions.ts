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

export async function getTongQuanStats() {
  await checkAdminAuth();
  const adminSupabase = await createAdminClient();

  const [
    { count: tongHocVien },
    { count: tongCauHoi },
    { count: tongVideo },
    { count: tongLyThuyet },
    { count: tongFlashcard }
  ] = await Promise.all([
    adminSupabase.from('hoc_vien').select('*', { count: 'exact', head: true }),
    adminSupabase.from('cau_hoi').select('*', { count: 'exact', head: true }),
    adminSupabase.from('bai_giang_video').select('*', { count: 'exact', head: true }),
    adminSupabase.from('bai_giang_ly_thuyet').select('*', { count: 'exact', head: true }),
    adminSupabase.from('flashcard').select('*', { count: 'exact', head: true })
  ]);

  // Tính học viên hoạt động 7 ngày qua
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const isoString = sevenDaysAgo.toISOString();

  const [ { data: activeOnLuyen }, { data: activeThi } ] = await Promise.all([
    adminSupabase.from('phien_on_luyen').select('hoc_vien_id').gte('ngay_lam', isoString),
    adminSupabase.from('ket_qua_thi').select('hoc_vien_id').gte('ngay_thi', isoString)
  ]);

  // Hợp nhất loại trùng bằng Set
  const activeIds = new Set([
    ...(activeOnLuyen?.map(d => d.hoc_vien_id) || []),
    ...(activeThi?.map(d => d.hoc_vien_id) || [])
  ]);

  return {
    tongHocVien: tongHocVien || 0,
    hocVienHoatDong: activeIds.size,
    tongCauHoi: tongCauHoi || 0,
    tongVideo: tongVideo || 0,
    tongLyThuyet: tongLyThuyet || 0,
    tongFlashcard: tongFlashcard || 0
  };
}

export async function getChuyenDeStats() {
  await checkAdminAuth();
  const adminSupabase = await createAdminClient();

  // Lấy tổng học viên để chia %
  const { count: tongHocVienCount } = await adminSupabase.from('hoc_vien').select('*', { count: 'exact', head: true });
  const tongHocVien = tongHocVienCount || 1; // Tránh chia 0

  const [
    { data: chuyenDeList },
    { data: cauHoiList },
    { data: phienOnLuyenList },
    { data: ketQuaThiList },
    { data: videoList },
    { data: lyThuyetList },
    { data: videoTienDoList },
    { data: lyThuyetTienDoList }
  ] = await Promise.all([
    adminSupabase.from('danh_muc_chuyen_de').select('id, ten, slug'),
    adminSupabase.from('cau_hoi').select('chuyen_de_id'),
    adminSupabase.from('phien_on_luyen').select('chuyen_de_id, so_cau_da_lam, so_cau_dung'),
    adminSupabase.from('ket_qua_thi').select('chuyen_de_id, diem_so').eq('loai_bai', 'thi_thu'),
    adminSupabase.from('bai_giang_video').select('id, chuyen_de_id'),
    adminSupabase.from('bai_giang_ly_thuyet').select('id, chuyen_de_id'),
    adminSupabase.from('video_tien_do').select('hoc_vien_id, video_id').eq('da_hoan_thanh', true),
    adminSupabase.from('tien_do_hoc_lieu').select('hoc_vien_id, bai_ly_thuyet_id').eq('da_hoan_thanh', true)
  ]);

  if (!chuyenDeList) return [];

  // Map: id bài giảng -> chuyen_de_id
  const videoToChuyenDe = new Map((videoList || []).map(v => [v.id, v.chuyen_de_id]));
  const lyThuyetToChuyenDe = new Map((lyThuyetList || []).map(lt => [lt.id, lt.chuyen_de_id]));

  // Tính tổng số mục (video + lý thuyết) cho mỗi chuyên đề
  const tongMucPerChuyenDe = new Map<number, number>();
  (videoList || []).forEach(v => {
    tongMucPerChuyenDe.set(v.chuyen_de_id, (tongMucPerChuyenDe.get(v.chuyen_de_id) || 0) + 1);
  });
  (lyThuyetList || []).forEach(lt => {
    tongMucPerChuyenDe.set(lt.chuyen_de_id, (tongMucPerChuyenDe.get(lt.chuyen_de_id) || 0) + 1);
  });

  // Đếm số mục đã hoàn thành cho mỗi (chuyen_de_id, hoc_vien_id)
  // Key: `${chuyen_de_id}_${hoc_vien_id}`, Value: số mục đã hoàn thành
  const completedCountMap = new Map<string, number>();

  (videoTienDoList || []).forEach(td => {
    const chuyenDeId = videoToChuyenDe.get(td.video_id);
    if (chuyenDeId) {
      const key = `${chuyenDeId}_${td.hoc_vien_id}`;
      completedCountMap.set(key, (completedCountMap.get(key) || 0) + 1);
    }
  });

  (lyThuyetTienDoList || []).forEach(td => {
    const chuyenDeId = lyThuyetToChuyenDe.get(td.bai_ly_thuyet_id);
    if (chuyenDeId) {
      const key = `${chuyenDeId}_${td.hoc_vien_id}`;
      completedCountMap.set(key, (completedCountMap.get(key) || 0) + 1);
    }
  });

  // Đếm số lượng học viên hoàn thành đủ mục cho mỗi chuyên đề
  const hocVienHoanThanhPerChuyenDe = new Map<number, Set<string>>();
  
  for (const [key, completedCount] of completedCountMap.entries()) {
    const [chuyenDeIdStr, hocVienId] = key.split('_');
    const chuyenDeId = parseInt(chuyenDeIdStr, 10);
    const tongMucYeuCau = tongMucPerChuyenDe.get(chuyenDeId) || 0;
    
    // YÊU CẦU: hoàn thành ĐỦ mục (so_muc_da_hoan_thanh = tong_so_muc)
    if (tongMucYeuCau > 0 && completedCount >= tongMucYeuCau) {
      if (!hocVienHoanThanhPerChuyenDe.has(chuyenDeId)) {
        hocVienHoanThanhPerChuyenDe.set(chuyenDeId, new Set());
      }
      hocVienHoanThanhPerChuyenDe.get(chuyenDeId)!.add(hocVienId);
    }
  }

  // Map số câu hỏi per chuyên đề
  const cauHoiPerChuyenDe = new Map<number, number>();
  (cauHoiList || []).forEach(ch => {
    cauHoiPerChuyenDe.set(ch.chuyen_de_id, (cauHoiPerChuyenDe.get(ch.chuyen_de_id) || 0) + 1);
  });

  // Calculate stats per chuyên đề
  const stats = chuyenDeList.map(cd => {
    const soCauHoi = cauHoiPerChuyenDe.get(cd.id) || 0;

    // Ôn luyện
    const onLuyen = (phienOnLuyenList || []).filter(p => p.chuyen_de_id === cd.id);
    const tongDaLam = onLuyen.reduce((sum, p) => sum + (p.so_cau_da_lam || 0), 0);
    const tongDung = onLuyen.reduce((sum, p) => sum + (p.so_cau_dung || 0), 0);
    const tyLeOnLuyen = tongDaLam > 0 ? (tongDung / tongDaLam) * 100 : 0;

    // Thi thử
    const thiThu = (ketQuaThiList || []).filter(k => k.chuyen_de_id === cd.id);
    const tongDiem = thiThu.reduce((sum, k) => sum + (k.diem_so || 0), 0);
    const tyLeThiThu = thiThu.length > 0 ? (tongDiem / thiThu.length) * 10 : 0; // điểm 10 => 100%

    // Học liệu
    const tongMuc = tongMucPerChuyenDe.get(cd.id) || 0;
    let tyLeHocLieu = 0;
    
    if (tongMuc === 0) {
      tyLeHocLieu = 100; // Không có bài giảng thì coi như 100%
    } else {
      const soHocVienHoanThanh = hocVienHoanThanhPerChuyenDe.get(cd.id)?.size || 0;
      tyLeHocLieu = (soHocVienHoanThanh / tongHocVien) * 100;
    }

    const diemYeuKien = (tyLeOnLuyen + tyLeThiThu) / 2;

    return {
      id: cd.id,
      ten: cd.ten,
      soCauHoi,
      tyLeOnLuyen: Math.round(tyLeOnLuyen),
      tyLeThiThu: Math.round(tyLeThiThu),
      tyLeHocLieu: Math.round(tyLeHocLieu),
      _sortScore: diemYeuKien || 1000 // Yếu nhất lên đầu
    };
  });

  return stats.sort((a, b) => a._sortScore - b._sortScore);
}

export async function getKyThiStats() {
  await checkAdminAuth();
  const adminSupabase = await createAdminClient();

  const [
    { data: kyThiList },
    { data: phienLamBaiList }
  ] = await Promise.all([
    adminSupabase.from('ky_thi').select('id, ten_ky_thi').in('trang_thai', ['active', 'da_ket_thuc', 'hoan_thanh']),
    adminSupabase.from('ky_thi_phien_lam_bai').select('ky_thi_id, diem_so, hoc_vien_id').eq('trang_thai', 'da_nop')
  ]);

  if (!kyThiList) return [];

  const results = kyThiList.map(kt => {
    const ketQua = (phienLamBaiList || []).filter(kq => kq.ky_thi_id === kt.id);
    const soHocVien = new Set(ketQua.map(kq => kq.hoc_vien_id)).size;
    
    let diemTrungBinh = 0;
    let diemCaoNhat = 0;
    let diemThapNhat = 0;

    if (ketQua.length > 0) {
      const diemSoArr = ketQua.map(kq => kq.diem_so || 0);
      diemCaoNhat = Math.max(...diemSoArr);
      diemThapNhat = Math.min(...diemSoArr);
      diemTrungBinh = diemSoArr.reduce((sum, score) => sum + score, 0) / ketQua.length;
    }

    return {
      id: kt.id,
      ten_ky_thi: kt.ten_ky_thi,
      soHocVien,
      diemTrungBinh: Number(diemTrungBinh.toFixed(2)),
      diemCaoNhat,
      diemThapNhat
    };
  });

  return results.sort((a, b) => b.soHocVien - a.soHocVien);
}
