create table public.lich_su_on_luyen (
  id uuid primary key default gen_random_uuid(),
  hoc_vien_id uuid references auth.users(id) on delete cascade not null,
  cau_hoi_id uuid references public.cau_hoi(id) not null,
  lua_chon_da_chon char(1) not null,
  dung boolean not null,
  ngay_lam timestamptz default now()
);

alter table public.lich_su_on_luyen enable row level security;

-- Học viên chỉ được xem lịch sử của chính mình
create policy "Học viên tự xem lịch sử"
  on public.lich_su_on_luyen for select
  using (hoc_vien_id = auth.uid());

-- Học viên chỉ được tạo lịch sử của chính mình
create policy "Học viên tự thêm lịch sử"
  on public.lich_su_on_luyen for insert
  with check (hoc_vien_id = auth.uid());

-- KHÔNG CÓ POLICY cho UPDATE và DELETE (Bảo vệ dữ liệu không bị sửa đổi)
