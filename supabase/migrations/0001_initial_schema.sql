-- Học viên
create table hoc_vien (
  id uuid primary key default auth.uid(),
  email text unique not null,
  ho_ten text not null,
  loai_tai_khoan text default 'free' check (loai_tai_khoan in ('free', 'vip', 'admin')),
  vip_het_han timestamptz, -- chỉ dùng từ Giai đoạn 2
  created_at timestamptz default now()
);
alter table hoc_vien enable row level security;
create policy "tu_xem_thong_tin" on hoc_vien for select using (auth.uid() = id);

-- Ngân hàng câu hỏi
create table cau_hoi (
  id uuid primary key default gen_random_uuid(),
  chuyen_de text not null,
  noi_dung text not null,
  cac_lua_chon jsonb not null,
  dap_an_dung char(1) not null,          -- KHÔNG bao giờ select qua client role
  giai_thich_chi_tiet text,               -- KHÔNG bao giờ select qua client role
  nguoi_tao_id uuid references hoc_vien(id)
);
alter table cau_hoi enable row level security;
-- Policy chỉ cho phép SELECT các cột an toàn qua view riêng, không select * bảng gốc
create view cau_hoi_public as
  select id, chuyen_de, noi_dung, cac_lua_chon from cau_hoi;

-- Ủng hộ (Giai đoạn 1 — độc lập hoàn toàn, KHÔNG có cột ảnh hưởng quyền hạn)
create table ung_ho (
  id uuid primary key default gen_random_uuid(),
  hoc_vien_id uuid references hoc_vien(id), -- nullable: cho ẩn danh
  ten_hien_thi text,
  so_tien numeric not null,
  loi_nhan text,
  cong_khai boolean default true,
  ma_giao_dich text unique,
  trang_thai text default 'cho_xu_ly' check (trang_thai in ('cho_xu_ly','thanh_cong','that_bai')),
  created_at timestamptz default now()
);

-- Kết quả thi
create table ket_qua_thi (
  id uuid primary key default gen_random_uuid(),
  hoc_vien_id uuid references hoc_vien(id),
  loai_bai text check (loai_bai in ('luyen_tap', 'thi_thu')),
  diem_so numeric,
  chi_tiet_bai_lam jsonb,
  thoi_gian_hoan_thanh int,
  ngay_thi timestamptz default now()
);

-- Giai đoạn 2 — bảng riêng, KHÔNG dùng chung với ung_ho
create table goi_thue_bao (
  id uuid primary key default gen_random_uuid(),
  hoc_vien_id uuid references hoc_vien(id),
  goi text check (goi in ('thang','quy','nam')),
  gia numeric not null,
  ma_giao_dich text unique,
  trang_thai text default 'cho_xu_ly' check (trang_thai in ('cho_xu_ly','thanh_cong','that_bai')),
  ngay_bat_dau timestamptz,
  ngay_ket_thuc timestamptz,
  created_at timestamptz default now()
);

-- Bổ sung explicit Postgres grants cho PostgREST API (yêu cầu từ 30/05/2026)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
