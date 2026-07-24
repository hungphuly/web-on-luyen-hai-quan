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

export interface LichSuOnLuyen {
  id: string;
  hoc_vien_id: string;
  cau_hoi_id: string;
  lua_chon_da_chon: string;
  dung: boolean;
  ngay_lam: string;
  cau_hoi?: {
    noi_dung: string;
    chuyen_de?: {
      ten: string;
    }
  };
}
