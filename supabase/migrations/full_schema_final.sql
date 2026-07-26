-- Bổ sung explicit Postgres grants cho PostgREST API
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- ==========================================
-- BẢNG 1: hoc_vien
-- ==========================================
create table public.hoc_vien (
  id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  email text unique not null,
  ho_ten text not null,
  loai_tai_khoan text default 'free' check (loai_tai_khoan in ('free', 'vip', 'admin')),
  vip_het_han timestamptz,
  created_at timestamptz default now()
);
alter table public.hoc_vien enable row level security;
create policy "tu_xem_thong_tin" on public.hoc_vien for select using (auth.uid() = id);

-- ==========================================
-- TRIGGER: Tự động tạo hồ sơ học viên khi Sign up
-- ==========================================
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.hoc_vien (id, email, ho_ten, loai_tai_khoan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'free'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- BẢNG 2: ung_ho
-- ==========================================
create table public.ung_ho (
  id uuid primary key default gen_random_uuid(),
  hoc_vien_id uuid references public.hoc_vien(id),
  ten_hien_thi text,
  so_tien numeric not null,
  loi_nhan text,
  cong_khai boolean default true,
  ma_giao_dich text unique,
  trang_thai text default 'cho_xu_ly' check (trang_thai in ('cho_xu_ly','thanh_cong','that_bai')),
  created_at timestamptz default now()
);
alter table public.ung_ho enable row level security;
create policy "xem_ung_ho_cong_khai" on public.ung_ho for select using (cong_khai = true);

-- ==========================================
-- BẢNG 3: ket_qua_thi
-- ==========================================
create table public.ket_qua_thi (
  id uuid primary key default gen_random_uuid(),
  hoc_vien_id uuid references public.hoc_vien(id),
  loai_bai text check (loai_bai in ('luyen_tap', 'thi_thu')),
  diem_so numeric,
  chi_tiet_bai_lam jsonb,
  thoi_gian_hoan_thanh int,
  ngay_thi timestamptz default now()
);
alter table public.ket_qua_thi enable row level security;
create policy "hoc_vien_xem_ket_qua" on public.ket_qua_thi for select using (hoc_vien_id = auth.uid());

-- ==========================================
-- BẢNG 4: goi_thue_bao
-- ==========================================
create table public.goi_thue_bao (
  id uuid primary key default gen_random_uuid(),
  hoc_vien_id uuid references public.hoc_vien(id),
  goi text check (goi in ('thang','quy','nam')),
  gia numeric not null,
  ma_giao_dich text unique,
  trang_thai text default 'cho_xu_ly' check (trang_thai in ('cho_xu_ly','thanh_cong','that_bai')),
  ngay_bat_dau timestamptz,
  ngay_ket_thuc timestamptz,
  created_at timestamptz default now()
);
alter table public.goi_thue_bao enable row level security;
create policy "hoc_vien_xem_goi_thue_bao" on public.goi_thue_bao for select using (hoc_vien_id = auth.uid());

-- ==========================================
-- BẢNG 5: danh_muc_chuyen_de
-- ==========================================
create table public.danh_muc_chuyen_de (
  id uuid default gen_random_uuid() primary key,
  ten text not null unique,
  slug text not null unique,
  mo_ta text,
  thu_tu integer default 0
);
alter table public.danh_muc_chuyen_de enable row level security;
create policy "Cho phép tất cả mọi người xem chuyên đề"
  on public.danh_muc_chuyen_de for select
  using (true);

-- Seed danh_muc_chuyen_de
insert into public.danh_muc_chuyen_de (ten, slug, thu_tu, mo_ta) values
('Mã HS', 'ma-hs', 1, 'Hệ thống hài hoà mô tả và mã hoá hàng hoá'),
('Incoterms', 'incoterms', 2, 'Các điều kiện thương mại quốc tế'),
('Thủ tục hải quan', 'thu-tuc-hai-quan', 3, 'Quy trình và thủ tục hải quan điện tử');

-- ==========================================
-- BẢNG 6: bai_giang_video
-- ==========================================
create table public.bai_giang_video (
  id uuid default gen_random_uuid() primary key,
  tieu_de text not null,
  mo_ta text,
  youtube_id text not null,
  chuyen_de_id uuid references public.danh_muc_chuyen_de(id) not null,
  thu_tu integer not null default 0,
  created_at timestamptz default now()
);
alter table public.bai_giang_video enable row level security;
create policy "Cho phép tất cả mọi người xem video"
  on public.bai_giang_video for select
  using (true);

-- ==========================================
-- BẢNG 7: bai_giang_ly_thuyet
-- ==========================================
create table public.bai_giang_ly_thuyet (
  id uuid default gen_random_uuid() primary key,
  tieu_de text not null,
  noi_dung_markdown text not null,
  hinh_anh_url text,
  chuyen_de_id uuid references public.danh_muc_chuyen_de(id) not null,
  thu_tu integer not null default 0,
  created_at timestamptz default now()
);
alter table public.bai_giang_ly_thuyet enable row level security;
create policy "Cho phép tất cả mọi người xem lý thuyết"
  on public.bai_giang_ly_thuyet for select
  using (true);

-- ==========================================
-- BẢNG 8: tien_do_hoc_lieu
-- ==========================================
create table public.tien_do_hoc_lieu (
  id uuid default gen_random_uuid() primary key,
  hoc_vien_id uuid references auth.users(id) on delete cascade not null,
  bai_ly_thuyet_id uuid references public.bai_giang_ly_thuyet(id) on delete cascade not null,
  da_hoan_thanh boolean default false,
  ngay_hoan_thanh timestamptz,
  unique(hoc_vien_id, bai_ly_thuyet_id)
);
alter table public.tien_do_hoc_lieu enable row level security;
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

-- ==========================================
-- BẢNG 9: cau_hoi
-- ==========================================
create table public.cau_hoi (
  id uuid primary key default gen_random_uuid(),
  chuyen_de_id uuid references public.danh_muc_chuyen_de(id) not null,
  noi_dung text not null,
  cac_lua_chon jsonb not null,
  dap_an_dung char(1) not null,
  giai_thich_chi_tiet text,
  can_cu_phap_ly text not null,
  do_kho integer check (do_kho in (1, 2, 3)),
  phan_loai integer default 1 check (phan_loai in (1, 2, 3)),
  nguoi_tao_id uuid references public.hoc_vien(id)
);
alter table public.cau_hoi enable row level security;
create policy "Chỉ admin được toàn quyền thao tác câu hỏi"
  on public.cau_hoi for all
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

-- VIEW: cau_hoi_public (chỉ chứa cột an toàn)
create view public.cau_hoi_public as
  select 
    id, 
    chuyen_de_id, 
    noi_dung, 
    cac_lua_chon,
    do_kho,
    phan_loai
  from public.cau_hoi;

-- ==========================================
-- BẢNG 10: lich_su_on_luyen
-- ==========================================
create table public.lich_su_on_luyen (
  id uuid primary key default gen_random_uuid(),
  hoc_vien_id uuid references auth.users(id) on delete cascade not null,
  cau_hoi_id uuid references public.cau_hoi(id) not null,
  lua_chon_da_chon char(1) not null,
  dung boolean not null,
  ngay_lam timestamptz default now()
);
alter table public.lich_su_on_luyen enable row level security;
create policy "Học viên tự xem lịch sử"
  on public.lich_su_on_luyen for select
  using (hoc_vien_id = auth.uid());
create policy "Học viên tự thêm lịch sử"
  on public.lich_su_on_luyen for insert
  with check (hoc_vien_id = auth.uid());

-- ==========================================
-- BẢNG 11: flashcard
-- ==========================================
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

-- ==========================================
-- BẢNG 12: flashcard_tien_do
-- ==========================================
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


-- ==========================================
-- SEED DATA (Bài giảng, Flashcards)
-- ==========================================
DO $$
DECLARE
  hs_id uuid;
  inc_id uuid;
  thq_id uuid;
BEGIN
  -- Lấy id của các chuyên đề
  select id into hs_id from public.danh_muc_chuyen_de where slug = 'ma-hs';
  select id into inc_id from public.danh_muc_chuyen_de where slug = 'incoterms';
  select id into thq_id from public.danh_muc_chuyen_de where slug = 'thu-tuc-hai-quan';

  -- Seed Video
  IF hs_id IS NOT NULL THEN
    insert into public.bai_giang_video (tieu_de, mo_ta, youtube_id, chuyen_de_id, thu_tu) values
    ('Tổng quan về HS Code', 'Hướng dẫn cách phân loại và áp mã HS Code chuẩn xác cho hàng hóa xuất nhập khẩu theo quy tắc chung.', 'dQw4w9WgXcQ', hs_id, 1);
  END IF;
  
  IF inc_id IS NOT NULL THEN
    insert into public.bai_giang_video (tieu_de, mo_ta, youtube_id, chuyen_de_id, thu_tu) values
    ('Hiểu rõ 11 điều kiện Incoterms 2020', 'Phân tích chi tiết trách nhiệm, rủi ro và chi phí của người mua - người bán trong Incoterms 2020.', 'dQw4w9WgXcQ', inc_id, 2);
  END IF;

  IF thq_id IS NOT NULL THEN
    insert into public.bai_giang_video (tieu_de, mo_ta, youtube_id, chuyen_de_id, thu_tu) values
    ('Quy trình thủ tục hải quan điện tử', 'Các bước khai báo thủ tục hải quan trên hệ thống VNACCS/VCIS.', 'dQw4w9WgXcQ', thq_id, 3);
  END IF;

  -- Seed Lý thuyết
  IF hs_id IS NOT NULL THEN
    insert into public.bai_giang_ly_thuyet (tieu_de, noi_dung_markdown, chuyen_de_id, thu_tu, hinh_anh_url) values
    ('6 Quy tắc tổng quát phân loại HS Code', '# Quy tắc tổng quát áp mã HS...', hs_id, 1, 'https://picsum.photos/800/400?random=1');
  END IF;

  IF inc_id IS NOT NULL THEN
    insert into public.bai_giang_ly_thuyet (tieu_de, noi_dung_markdown, chuyen_de_id, thu_tu, hinh_anh_url) values
    ('Tóm tắt Incoterms 2020 (Nhóm E, F, C, D)', '# Tổng quan các nhóm Incoterms 2020...', inc_id, 2, 'https://picsum.photos/800/400?random=2');
  END IF;

  IF thq_id IS NOT NULL THEN
    insert into public.bai_giang_ly_thuyet (tieu_de, noi_dung_markdown, chuyen_de_id, thu_tu, hinh_anh_url) values
    ('Quy trình khai báo Hải Quan Điện Tử (VNACCS/VCIS)', '# Khai báo Hải quan VNACCS/VCIS...', thq_id, 3, 'https://picsum.photos/800/400?random=3');
  END IF;

  -- Seed Flashcard
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
