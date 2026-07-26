export interface CauHoiPublic {
  id: string;
  chuyen_de_id: string;
  noi_dung: string;
  cac_lua_chon: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
}

export interface KetQuaChamDiem {
  dung: boolean;
  dap_an_dung: string;
  can_cu_phap_ly: string;
}

export interface PhienOnLuyen {
  id: string;
  hoc_vien_id: string;
  chuyen_de_id: string;
  so_cau_da_lam: number;
  so_cau_dung: number;
  ngay_lam: string;
  chuyen_de?: {
    ten: string;
  }
}
