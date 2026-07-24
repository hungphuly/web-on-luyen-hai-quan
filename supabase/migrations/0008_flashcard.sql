create table public.flashcard (
  id uuid primary key default gen_random_uuid(),
  chuyen_de_id uuid references public.danh_muc_chuyen_de(id) not null,
  mat_truoc text not null,
  mat_sau text not null,
  created_at timestamptz default now()
);

alter table public.flashcard enable row level security;

create policy "Xem flashcard công khai" on public.flashcard for select using (true);
create policy "Quản lý flashcard admin" on public.flashcard for all
  using (exists (select 1 from public.hoc_vien where id = auth.uid() and loai_tai_khoan = 'admin'))
  with check (exists (select 1 from public.hoc_vien where id = auth.uid() and loai_tai_khoan = 'admin'));

create table public.flashcard_tien_do (
  id uuid primary key default gen_random_uuid(),
  hoc_vien_id uuid references auth.users(id) on delete cascade not null,
  flashcard_id uuid references public.flashcard(id) not null,
  hop_so integer not null default 1,
  ngay_on_lai_tiep_theo date not null default current_date,
  unique(hoc_vien_id, flashcard_id)
);

alter table public.flashcard_tien_do enable row level security;

create policy "Học viên xem tiến độ flashcard" on public.flashcard_tien_do for select using (hoc_vien_id = auth.uid());
create policy "Học viên thêm tiến độ flashcard" on public.flashcard_tien_do for insert with check (hoc_vien_id = auth.uid());
create policy "Học viên sửa tiến độ flashcard" on public.flashcard_tien_do for update using (hoc_vien_id = auth.uid()) with check (hoc_vien_id = auth.uid());

-- Seed data for flashcard
DO $$
DECLARE
  hs_id uuid;
  inc_id uuid;
BEGIN
  -- Lấy id của Mã HS
  select id into hs_id from public.danh_muc_chuyen_de where slug = 'ma-hs';
  -- Lấy id của Incoterms
  select id into inc_id from public.danh_muc_chuyen_de where slug = 'incoterms';

  IF hs_id IS NOT NULL THEN
    insert into public.flashcard (chuyen_de_id, mat_truoc, mat_sau) values
    (hs_id, 'Quy tắc 1 (Mã HS)', 'Phân loại hàng hóa theo nội dung nhóm và chú giải phần, chương.'),
    (hs_id, 'Quy tắc 2a (Mã HS)', 'Phân loại hàng hóa ở dạng chưa lắp ráp, tháo rời như hàng nguyên chiếc.'),
    (hs_id, 'Quy tắc 3b (Mã HS)', 'Hàng hỗn hợp phân loại theo đặc tính cơ bản nhất của hàng.'),
    (hs_id, 'Chương 01', 'Động vật sống.'),
    (hs_id, 'Chương 02', 'Thịt và phụ phẩm dạng thịt ăn được sau giết mổ.');
  END IF;

  IF inc_id IS NOT NULL THEN
    insert into public.flashcard (chuyen_de_id, mat_truoc, mat_sau) values
    (inc_id, 'EXW', 'Ex Works (Giao tại xưởng): Người bán chịu rủi ro thấp nhất, giao tại xưởng của mình.'),
    (inc_id, 'FCA', 'Free Carrier (Giao cho người chuyên chở): Người bán giao hàng cho người vận tải do người mua chỉ định.'),
    (inc_id, 'FOB', 'Free On Board (Giao lên tàu): Rủi ro chuyển giao khi hàng được đặt an toàn trên boong tàu.'),
    (inc_id, 'CIF', 'Cost, Insurance & Freight (Tiền hàng, bảo hiểm, cước phí): Giống CFR nhưng bán mua thêm bảo hiểm.'),
    (inc_id, 'DDP', 'Delivered Duty Paid (Giao đã nộp thuế): Người bán chịu mọi rủi ro, chi phí kể cả thuế nhập khẩu.');
  END IF;
END $$;
