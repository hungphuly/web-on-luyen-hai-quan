export interface DanhMucChuyenDe {
  id: string;
  ten: string;
  slug: string;
  mo_ta: string | null;
  thu_tu: number;
}

export interface ChuyenDeStats extends DanhMucChuyenDe {
  video_count: number;
  ly_thuyet_count: number;
}

export interface BaiGiangVideo {
  id: string;
  tieu_de: string;
  mo_ta: string | null;
  youtube_id: string;
  chuyen_de_id: string;
  thu_tu: number;
  created_at: string;
}

export interface BaiGiangLyThuyet {
  id: string;
  tieu_de: string;
  noi_dung_markdown: string;
  chuyen_de_id: string;
  thu_tu: number;
  hinh_anh_url: string | null;
  file_dinh_kem_url?: string | null;
  created_at: string;
}

export interface TienDoHocLieu {
  id: string;
  hoc_vien_id: string;
  bai_ly_thuyet_id: string;
  da_hoan_thanh: boolean;
  ngay_hoan_thanh: string | null;
}

export interface VideoTienDo {
  id: string;
  hoc_vien_id: string;
  bai_giang_video_id: string;
  phan_tram_da_xem: number;
  da_hoan_thanh: boolean;
}
