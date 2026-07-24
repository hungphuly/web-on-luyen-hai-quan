-- 1. Tạo bảng danh_muc_chuyen_de
create table public.danh_muc_chuyen_de (
  id uuid default gen_random_uuid() primary key,
  ten text not null unique,
  slug text not null unique,
  mo_ta text,
  thu_tu integer default 0
);

-- Bật RLS
alter table public.danh_muc_chuyen_de enable row level security;
create policy "Cho phép tất cả mọi người xem chuyên đề"
  on public.danh_muc_chuyen_de for select
  using (true);

-- 2. Seed data từ 3 chuyên đề hiện có
insert into public.danh_muc_chuyen_de (ten, slug, thu_tu, mo_ta) values
('Mã HS', 'ma-hs', 1, 'Hệ thống hài hoà mô tả và mã hoá hàng hoá'),
('Incoterms', 'incoterms', 2, 'Các điều kiện thương mại quốc tế'),
('Thủ tục hải quan', 'thu-tuc-hai-quan', 3, 'Quy trình và thủ tục hải quan điện tử');

-- 3. Đổi bảng bai_giang_video
alter table public.bai_giang_video add column chuyen_de_id uuid references public.danh_muc_chuyen_de(id);

update public.bai_giang_video v 
set chuyen_de_id = c.id 
from public.danh_muc_chuyen_de c 
where v.chuyen_de = c.ten;

alter table public.bai_giang_video drop column chuyen_de;
alter table public.bai_giang_video alter column chuyen_de_id set not null;

-- 4. Đổi bảng bai_giang_ly_thuyet
alter table public.bai_giang_ly_thuyet add column chuyen_de_id uuid references public.danh_muc_chuyen_de(id);

update public.bai_giang_ly_thuyet l 
set chuyen_de_id = c.id 
from public.danh_muc_chuyen_de c 
where l.chuyen_de = c.ten;

alter table public.bai_giang_ly_thuyet drop column chuyen_de;
alter table public.bai_giang_ly_thuyet alter column chuyen_de_id set not null;
