-- Migration: AI Soạn nội dung (cau_hoi_nhap, flashcard_nhap)

create table if not exists public.cau_hoi_nhap (
  id uuid primary key default gen_random_uuid(),
  chuyen_de_id uuid references public.danh_muc_chuyen_de(id) on delete cascade not null,
  noi_dung text not null,
  cac_lua_chon jsonb not null,
  dap_an_dung char(1) not null,
  can_cu_phap_ly text,
  giai_thich_chi_tiet text,
  do_kho text check (do_kho in ('de', 'trung_binh', 'kho')) default 'trung_binh',
  phan_loai integer default 1 check (phan_loai in (1, 2, 3)),
  can_kiem_tra boolean default false,
  nguon_file text,
  trang_thai text default 'cho_duyet' check (trang_thai in ('cho_duyet', 'da_duyet', 'tu_choi')),
  tao_boi_ai boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.flashcard_nhap (
  id uuid primary key default gen_random_uuid(),
  chuyen_de_id uuid references public.danh_muc_chuyen_de(id) on delete cascade not null,
  mat_truoc text not null,
  mat_sau text not null,
  nguon_file text,
  trang_thai text default 'cho_duyet' check (trang_thai in ('cho_duyet', 'da_duyet', 'tu_choi')),
  tao_boi_ai boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.cau_hoi_nhap enable row level security;
alter table public.flashcard_nhap enable row level security;

-- Policies: Chỉ admin có quyền thao tác
create policy "Chỉ admin thao tác cau_hoi_nhap"
  on public.cau_hoi_nhap for all
  using (
    exists (
      select 1 from public.hoc_vien 
      where id = auth.uid() and loai_tai_khoan = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.hoc_vien 
      where id = auth.uid() and loai_tai_khoan = 'admin'
    )
  );

create policy "Chỉ admin thao tác flashcard_nhap"
  on public.flashcard_nhap for all
  using (
    exists (
      select 1 from public.hoc_vien 
      where id = auth.uid() and loai_tai_khoan = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.hoc_vien 
      where id = auth.uid() and loai_tai_khoan = 'admin'
    )
  );
