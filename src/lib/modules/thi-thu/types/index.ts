export interface DeThi {
  phienThiId: string;
  chuyenDeId: string;
  cauHoi: CauHoiThiThu[];
  thoiGianLamBai: number; // in seconds
}

export interface CauHoiThiThu {
  id: string;
  noi_dung: string;
  cac_lua_chon: any; // jsonb object
  la_nhieu_dap_an?: boolean;
}

export interface KetQuaThiThu {
  id: string;
  diem_so: string;
  thoi_gian_hoan_thanh: number;
  ngay_thi: string;
  chi_tiet_bai_lam: ChiTietCauHoiThiThu[];
  chuyen_de_ten?: string;
}

export interface ChiTietCauHoiThiThu {
  cau_hoi_id: string;
  noi_dung: string;
  cac_lua_chon: any;
  lua_chon_da_chon: string | null;
  dap_an_dung: string;
  giai_thich_chi_tiet?: string;
  can_cu_phap_ly?: string;
  la_nhieu_dap_an?: boolean;
  dung: boolean;
}
