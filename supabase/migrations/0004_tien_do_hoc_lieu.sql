-- Bổ sung cột hinh_anh_url vào bảng bai_giang_ly_thuyet
alter table public.bai_giang_ly_thuyet add column hinh_anh_url text;

-- Cập nhật dữ liệu mẫu (dùng placeholder)
update public.bai_giang_ly_thuyet 
set hinh_anh_url = 'https://picsum.photos/800/400?random=' || thu_tu
where hinh_anh_url is null;

-- Tạo bảng tiến độ học liệu
create table public.tien_do_hoc_lieu (
  id uuid default gen_random_uuid() primary key,
  hoc_vien_id uuid references auth.users(id) on delete cascade not null,
  bai_ly_thuyet_id uuid references public.bai_giang_ly_thuyet(id) on delete cascade not null,
  da_hoan_thanh boolean default false,
  ngay_hoan_thanh timestamptz,
  unique(hoc_vien_id, bai_ly_thuyet_id)
);

-- Bật RLS
alter table public.tien_do_hoc_lieu enable row level security;

-- Policies: Học viên chỉ được phép SELECT, INSERT, UPDATE tiến độ của chính mình
create policy "Học viên xem tiến độ của mình"
  on public.tien_do_hoc_lieu for select
  using (auth.uid() = hoc_vien_id);

create policy "Học viên cập nhật tiến độ của mình"
  on public.tien_do_hoc_lieu for insert
  with check (auth.uid() = hoc_vien_id);

create policy "Học viên sửa tiến độ của mình"
  on public.tien_do_hoc_lieu for update
  using (auth.uid() = hoc_vien_id)
  with check (auth.uid() = hoc_vien_id);
