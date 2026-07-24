-- Tạo bảng bai_giang_video
create table public.bai_giang_video (
  id uuid default gen_random_uuid() primary key,
  tieu_de text not null,
  mo_ta text,
  youtube_id text not null,
  chuyen_de text not null,
  thu_tu integer not null default 0,
  created_at timestamptz default now()
);

-- Bật RLS
alter table public.bai_giang_video enable row level security;

-- Cho phép SELECT công khai (cho tất cả)
create policy "Cho phép tất cả mọi người xem video"
  on public.bai_giang_video for select
  using (true);

-- Tạo bảng bai_giang_ly_thuyet
create table public.bai_giang_ly_thuyet (
  id uuid default gen_random_uuid() primary key,
  tieu_de text not null,
  noi_dung_markdown text not null,
  chuyen_de text not null,
  thu_tu integer not null default 0,
  created_at timestamptz default now()
);

-- Bật RLS
alter table public.bai_giang_ly_thuyet enable row level security;

-- Cho phép SELECT công khai
create policy "Cho phép tất cả mọi người xem lý thuyết"
  on public.bai_giang_ly_thuyet for select
  using (true);

-- Chèn dữ liệu mẫu (Seed Data) cho bai_giang_video
insert into public.bai_giang_video (tieu_de, mo_ta, youtube_id, chuyen_de, thu_tu) values
('Tổng quan về HS Code', 'Hướng dẫn cách phân loại và áp mã HS Code chuẩn xác cho hàng hóa xuất nhập khẩu theo quy tắc chung.', 'dQw4w9WgXcQ', 'Mã HS', 1),
('Hiểu rõ 11 điều kiện Incoterms 2020', 'Phân tích chi tiết trách nhiệm, rủi ro và chi phí của người mua - người bán trong Incoterms 2020.', 'dQw4w9WgXcQ', 'Incoterms', 2),
('Quy trình thủ tục hải quan điện tử', 'Các bước khai báo thủ tục hải quan trên hệ thống VNACCS/VCIS.', 'dQw4w9WgXcQ', 'Thủ tục hải quan', 3);

-- Chèn dữ liệu mẫu (Seed Data) cho bai_giang_ly_thuyet
insert into public.bai_giang_ly_thuyet (tieu_de, noi_dung_markdown, chuyen_de, thu_tu) values
('6 Quy tắc tổng quát phân loại HS Code', '
# Quy tắc tổng quát áp mã HS
Có 6 quy tắc tổng quát (GIR) để phân loại hàng hóa vào Danh mục Hài hòa (HS). Các quy tắc này phải được áp dụng tuần tự từ 1 đến 6.

## Quy tắc 1
Tên của các Phần, Chương và Phân chương chỉ nhằm mục đích tra cứu. Việc phân loại phải được xác định theo:
- Nội dung của các Nhóm (Heading)
- Chú giải Phần hoặc Chương tương ứng

> **Mẹo giải bài**: Luôn ưu tiên áp dụng Quy tắc 1 trước. Hầu hết hàng hóa đều có thể phân loại bằng Quy tắc này.
', 'Mã HS', 1),

('Tóm tắt Incoterms 2020 (Nhóm E, F, C, D)', '
# Tổng quan các nhóm Incoterms 2020
Incoterms 2020 được chia thành 4 nhóm cơ bản: E, F, C và D dựa trên mức độ rủi ro và chi phí chuyển giao.

### Nhóm E (EXW)
- Giao tại xưởng.
- Rủi ro và chi phí thuộc về người mua ngay tại cơ sở của người bán.

### Nhóm F (FCA, FAS, FOB)
- Giao cho người chuyên chở.
- Người bán không trả cước phí vận tải chính.

### Nhóm C (CFR, CIF, CPT, CIP)
- Cước phí trả tới.
- Người bán trả cước phí vận tải chính, nhưng rủi ro chuyển giao tại cảng/nơi đi.

### Nhóm D (DAP, DPU, DDP)
- Giao tại đích.
- Người bán chịu mọi rủi ro và chi phí đến nơi đích.

| Nhóm | Vận tải chính | Rủi ro chuyển giao |
|------|---------------|-------------------|
| E    | Mua trả       | Xưởng người bán   |
| F    | Mua trả       | Nơi xuất phát     |
| C    | Bán trả       | Nơi xuất phát     |
| D    | Bán trả       | Nơi đến           |
', 'Incoterms', 2),

('Quy trình khai báo Hải Quan Điện Tử (VNACCS/VCIS)', '
# Khai báo Hải quan VNACCS/VCIS

Quy trình chuẩn bao gồm 4 bước:
1. **Khai thông tin nhập khẩu (IDA)**: Đăng ký thông tin trước khi khai chính thức.
2. **Khai chính thức (IDC)**: Đẩy dữ liệu chính thức, hệ thống trả về số tờ khai.
3. **Lấy kết quả phân luồng**:
   - Luồng Xanh (1): Miễn kiểm tra hồ sơ và thực tế.
   - Luồng Vàng (2): Kiểm tra chi tiết hồ sơ.
   - Luồng Đỏ (3): Kiểm tra chi tiết hồ sơ và kiểm tra thực tế hàng hóa.
4. **Nộp thuế và thông quan**: Thanh toán các khoản thuế phí liên quan và lấy lệnh thông quan.
', 'Thủ tục hải quan', 3);
