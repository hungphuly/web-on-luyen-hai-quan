export interface KyThi {
  id: string;
  ten_ky_thi: string;
  mo_ta: string | null;
  thoi_gian_lam_bai: number;
  phan_loai_cau_hoi: number[];
  thoi_gian_bat_dau: string | null;
  thoi_gian_ket_thuc: string | null;
  cau_hinh_chuyen_de: string[] | null;
  so_luong_cau_hoi: number;
  doi_tuong_thi: any;
  trang_thai: 'draft' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface KyThiPhienLamBai {
  id: string;
  ky_thi_id: string;
  hoc_vien_id: string;
  bat_dau_luc: string;
  ket_thuc_luc: string | null;
  trang_thai: 'dang_thi' | 'da_nop';
  danh_sach_cau_hoi: any;
  bai_lam_tam_thoi: any;
  ket_qua: any;
  diem_so: number | null;
}
