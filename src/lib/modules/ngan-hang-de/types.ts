export interface CauHoiAdmin {
  id: string;
  chuyen_de_id: string;
  noi_dung: string;
  cac_lua_chon: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  dap_an_dung: 'a' | 'b' | 'c' | 'd';
  giai_thich_chi_tiet: string | null;
  can_cu_phap_ly: string;
  do_kho: 1 | 2 | 3;
  phan_loai: number[];
  nguoi_tao_id: string | null;
  chuyen_de?: { ten: string }; // Join relation
}

export interface ExcelRowData {
  chuyen_de: string;
  noi_dung: string;
  lua_chon_a: string;
  lua_chon_b: string;
  lua_chon_c: string;
  lua_chon_d: string;
  dap_an_dung: string;
  van_ban_tham_chieu: string;
  dieu_khoan: string;
  giai_thich: string;
  do_kho: number;
  phan_loai: string | number;
}

export interface ImportError {
  row: number;
  reason: string;
}
