import { createAdminClient } from '@/lib/shared/utils/supabase/server';

export interface ThongKeChuyenDe {
  chuyenDeId: string;
  tenChuyenDe: string;
  onLuyen: {
    soCauDaLam: number;
    soCauDung: number;
    tyLeDung: number; // 0 - 100
  };
  thiThu: {
    soLuotThi: number;
    tongCauHoi: number;
    tongCauDung: number;
    tyLeDung: number; // 0 - 100
    diemTrungBinh: number; // thang 10
  };
  hocLieu: {
    tongSoBai: number;
    daHoanThanh: number;
    tyLeHoanThanh: number; // 0 - 100
  };
}

export interface ThongKeCaNhanHocVien {
  hocVienId: string;
  tongSoCauOnLuyen: number;
  tongSoCauDungOnLuyen: number;
  tyLeDungOnLuyenChung: number;
  tongSoLuotThiThu: number;
  diemThiThuTrungBinhChung: number;
  tongBaiHocLieu: number;
  tongBaiHocLieuDaHoc: number;
  tyLeHocLieuChung: number;
  chiTietChuyenDe: ThongKeChuyenDe[];
  xuHuong7Ngay: {
    tyLeDung7NgayQua: number | null;
    tyLeDungTruocDo: number | null;
    chenhLech: number | null;
    trangThai: 'tien_bo' | 'giam_sut' | 'on_dinh' | 'chua_du_du_lieu';
    moTa: string;
  };
  coDuLieuHocTap: boolean;
}

export async function layThongKeCaNhan(hocVienId: string): Promise<ThongKeCaNhanHocVien> {
  const adminSupabase = await createAdminClient();

  const [
    { data: chuyenDeList },
    { data: phienOnLuyenList },
    { data: ketQuaThiList },
    { data: videoList },
    { data: lyThuyetList },
    { data: videoTienDoList },
    { data: lyThuyetTienDoList }
  ] = await Promise.all([
    adminSupabase.from('danh_muc_chuyen_de').select('id, ten, slug, thu_tu').order('thu_tu', { ascending: true }),
    adminSupabase.from('phien_on_luyen').select('chuyen_de_id, so_cau_da_lam, so_cau_dung, ngay_lam').eq('hoc_vien_id', hocVienId),
    adminSupabase.from('ket_qua_thi').select('chuyen_de_id, diem_so, chi_tiet_bai_lam, ngay_thi, loai_bai').eq('hoc_vien_id', hocVienId).eq('loai_bai', 'thi_thu'),
    adminSupabase.from('bai_giang_video').select('id, chuyen_de_id'),
    adminSupabase.from('bai_giang_ly_thuyet').select('id, chuyen_de_id'),
    adminSupabase.from('video_tien_do').select('video_id, da_hoan_thanh').eq('hoc_vien_id', hocVienId).eq('da_hoan_thanh', true),
    adminSupabase.from('tien_do_hoc_lieu').select('bai_ly_thuyet_id, da_hoan_thanh').eq('hoc_vien_id', hocVienId).eq('da_hoan_thanh', true)
  ]);

  const validChuyenDe = chuyenDeList || [];
  const onLuyen = phienOnLuyenList || [];
  const thiThu = ketQuaThiList || [];
  const videos = videoList || [];
  const lyThuyet = lyThuyetList || [];
  const videoDoneIds = new Set((videoTienDoList || []).map(v => v.video_id));
  const lyThuyetDoneIds = new Set((lyThuyetTienDoList || []).map(lt => lt.bai_ly_thuyet_id));

  // 1. Phân tích chi tiết theo từng chuyên đề
  let tongCauOnLuyenAll = 0;
  let tongCauDungOnLuyenAll = 0;
  let tongLuotThiThuAll = 0;
  let tongCauHoiThiThuAll = 0;
  let tongCauDungThiThuAll = 0;
  let tongBaiHocLieuAll = 0;
  let tongBaiHocLieuDoneAll = 0;

  const chiTietChuyenDe: ThongKeChuyenDe[] = validChuyenDe.map(cd => {
    // Ôn luyện của chuyên đề
    const onLuyenCD = onLuyen.filter(p => p.chuyen_de_id === cd.id);
    const soCauDaLam = onLuyenCD.reduce((sum, p) => sum + (p.so_cau_da_lam || 0), 0);
    const soCauDung = onLuyenCD.reduce((sum, p) => sum + (p.so_cau_dung || 0), 0);
    const tyLeDungOnLuyen = soCauDaLam > 0 ? Math.round((soCauDung / soCauDaLam) * 100) : 0;

    tongCauOnLuyenAll += soCauDaLam;
    tongCauDungOnLuyenAll += soCauDung;

    // Thi thử của chuyên đề
    const thiThuCD = thiThu.filter(k => k.chuyen_de_id === cd.id);
    const soLuotThi = thiThuCD.length;
    let tongCauHoiThiThu = 0;
    let tongCauDungThiThu = 0;

    thiThuCD.forEach(k => {
      const details = (k.chi_tiet_bai_lam as any[]) || [];
      const totalInExam = details.length > 0 ? details.length : 20;
      // Nếu có chi_tiet_bai_lam, đếm câu dung: true; nếu không, dùng diem_so (số câu đúng thô)
      const correctInExam = details.length > 0 
        ? details.filter(d => d.dung === true).length 
        : (Number(k.diem_so) || 0);

      tongCauHoiThiThu += totalInExam;
      tongCauDungThiThu += correctInExam;
    });

    const tyLeDungThiThu = tongCauHoiThiThu > 0 ? Math.round((tongCauDungThiThu / tongCauHoiThiThu) * 100) : 0;
    const diemTrungBinh = tongCauHoiThiThu > 0 
      ? Number(((tongCauDungThiThu / tongCauHoiThiThu) * 10).toFixed(2)) 
      : 0;

    tongLuotThiThuAll += soLuotThi;
    tongCauHoiThiThuAll += tongCauHoiThiThu;
    tongCauDungThiThuAll += tongCauDungThiThu;

    // Học liệu của chuyên đề
    const cdVideos = videos.filter(v => v.chuyen_de_id === cd.id);
    const cdLyThuyet = lyThuyet.filter(lt => lt.chuyen_de_id === cd.id);
    const tongSoBai = cdVideos.length + cdLyThuyet.length;

    const doneVideos = cdVideos.filter(v => videoDoneIds.has(v.id)).length;
    const doneLyThuyet = cdLyThuyet.filter(lt => lyThuyetDoneIds.has(lt.id)).length;
    const daHoanThanh = doneVideos + doneLyThuyet;
    const tyLeHoanThanh = tongSoBai > 0 ? Math.round((daHoanThanh / tongSoBai) * 100) : 100;

    tongBaiHocLieuAll += tongSoBai;
    tongBaiHocLieuDoneAll += daHoanThanh;

    return {
      chuyenDeId: cd.id,
      tenChuyenDe: cd.ten,
      onLuyen: {
        soCauDaLam,
        soCauDung,
        tyLeDung: tyLeDungOnLuyen
      },
      thiThu: {
        soLuotThi,
        tongCauHoi: tongCauHoiThiThu,
        tongCauDung: tongCauDungThiThu,
        tyLeDung: tyLeDungThiThu,
        diemTrungBinh
      },
      hocLieu: {
        tongSoBai,
        daHoanThanh,
        tyLeHoanThanh
      }
    };
  });

  // 2. Tính xu hướng 7 ngày gần nhất
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Gom toàn bộ câu hỏi ôn luyện & thi thử theo 2 khoảng thời gian
  let recentTotal = 0;
  let recentCorrect = 0;
  let previousTotal = 0;
  let previousCorrect = 0;

  // Lọc thi thử
  thiThu.forEach(k => {
    const examDate = k.ngay_thi ? new Date(k.ngay_thi) : null;
    const details = (k.chi_tiet_bai_lam as any[]) || [];
    const totalInExam = details.length > 0 ? details.length : 20;
    const correctInExam = details.length > 0 
      ? details.filter(d => d.dung === true).length 
      : (Number(k.diem_so) || 0);

    if (examDate && examDate >= sevenDaysAgo) {
      recentTotal += totalInExam;
      recentCorrect += correctInExam;
    } else if (examDate) {
      previousTotal += totalInExam;
      previousCorrect += correctInExam;
    }
  });

  // Lọc ôn luyện
  onLuyen.forEach(p => {
    const pDate = p.ngay_lam ? new Date(p.ngay_lam) : null;
    const total = p.so_cau_da_lam || 0;
    const correct = p.so_cau_dung || 0;

    if (pDate && pDate >= sevenDaysAgo) {
      recentTotal += total;
      recentCorrect += correct;
    } else if (pDate) {
      previousTotal += total;
      previousCorrect += correct;
    }
  });

  const tyLeDung7NgayQua = recentTotal > 0 ? Math.round((recentCorrect / recentTotal) * 100) : null;
  const tyLeDungTruocDo = previousTotal > 0 ? Math.round((previousCorrect / previousTotal) * 100) : null;

  let trangThai: 'tien_bo' | 'giam_sut' | 'on_dinh' | 'chua_du_du_lieu' = 'chua_du_du_lieu';
  let chenhLech: number | null = null;
  let moTa = 'Chưa đủ dữ liệu để so sánh xu hướng.';

  if (tyLeDung7NgayQua !== null && tyLeDungTruocDo !== null) {
    chenhLech = tyLeDung7NgayQua - tyLeDungTruocDo;
    if (chenhLech >= 3) {
      trangThai = 'tien_bo';
      moTa = `Tiến bộ rõ rệt (+${chenhLech}% so với giai đoạn trước).`;
    } else if (chenhLech <= -3) {
      trangThai = 'giam_sut';
      moTa = `Tỷ lệ đúng giảm nhẹ (${chenhLech}% so với trước), cần chú ý củng cố lại kiến thức.`;
    } else {
      trangThai = 'on_dinh';
      moTa = `Phong độ duy trì ổn định (~${tyLeDung7NgayQua}%).`;
    }
  } else if (tyLeDung7NgayQua !== null) {
    moTa = `7 ngày gần nhất đạt tỷ lệ đúng ${tyLeDung7NgayQua}%.`;
  }

  const tyLeDungOnLuyenChung = tongCauOnLuyenAll > 0 ? Math.round((tongCauDungOnLuyenAll / tongCauOnLuyenAll) * 100) : 0;
  const diemThiThuTrungBinhChung = tongCauHoiThiThuAll > 0 
    ? Number(((tongCauDungThiThuAll / tongCauHoiThiThuAll) * 10).toFixed(2)) 
    : 0;
  const tyLeHocLieuChung = tongBaiHocLieuAll > 0 ? Math.round((tongBaiHocLieuDoneAll / tongBaiHocLieuAll) * 100) : 0;
  const coDuLieuHocTap = tongCauOnLuyenAll > 0 || tongLuotThiThuAll > 0 || tongBaiHocLieuDoneAll > 0;

  return {
    hocVienId,
    tongSoCauOnLuyen: tongCauOnLuyenAll,
    tongSoCauDungOnLuyen: tongCauDungOnLuyenAll,
    tyLeDungOnLuyenChung,
    tongSoLuotThiThu: tongLuotThiThuAll,
    diemThiThuTrungBinhChung,
    tongBaiHocLieu: tongBaiHocLieuAll,
    tongBaiHocLieuDaHoc: tongBaiHocLieuDoneAll,
    tyLeHocLieuChung,
    chiTietChuyenDe,
    xuHuong7Ngay: {
      tyLeDung7NgayQua,
      tyLeDungTruocDo,
      chenhLech,
      trangThai,
      moTa
    },
    coDuLieuHocTap
  };
}
