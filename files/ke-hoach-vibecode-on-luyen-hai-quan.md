# WEB ÔN LUYỆN HẢI QUAN — KẾ HOẠCH VIBECODE (v4.0)
**Dùng để đưa vào Google Antigravity**
**Mô hình hóa doanh thu theo 2 giai đoạn:** Donate thuần túy → Subscription

---

## 0. TÓM TẮT ĐIỀU CHỈNH SO VỚI BẢN v3.0

Bản v3.0 gắn donate trực tiếp với việc cộng lượt thi / gia hạn VIP. Theo yêu cầu mới nhất, dự án tách thành 2 giai đoạn rõ ràng:

| | Giai đoạn 1 (MVP) | Giai đoạn 2 (Thu phí) |
|---|---|---|
| Donate | Ủng hộ tự nguyện, **không đổi lại quyền lợi** | Vẫn giữ, tách biệt khỏi gói trả phí |
| Mô hình thu tiền | Không có | Subscription (gói tháng/quý/năm) kiểu website học tiếng Anh |
| Trạng thái tài khoản | `free` / `admin` | thêm `vip` với `vip_het_han` |
| Giới hạn tính năng | Áp dụng theo free-tier tĩnh (không đổi khi donate) | Gỡ giới hạn khi có subscription active |

Lý do tách pha: donate đổi lấy quyền lợi = bản chất giao dịch mua bán → phát sinh nghĩa vụ thuế/hóa đơn rõ ràng hơn nhiều so với ủng hộ tự nguyện thuần túy. Ở giai đoạn cá nhân, launch nhanh, giữ Giai đoạn 1 an toàn pháp lý và đơn giản hạ tầng.

---

## 1. MỤC TIÊU & PHẠM VI

- Nền tảng ôn luyện trắc nghiệm, thi thử, tra cứu pháp luật tự động cho học viên ôn thi Hải Quan.
- Giảm tải chấm điểm thủ công, hỗ trợ học qua Spaced Repetition (Flashcard).
- Quy mô cá nhân, chi phí hạ tầng mục tiêu ~0đ ở Giai đoạn 1.
- Deadline: hoàn thiện toàn bộ lộ trình trước **10/01/2027**.

---

## 2. GIẢI PHÁP CÔNG NGHỆ

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Framework | Next.js 15 hoặc 16 (App Router) + TypeScript strict — **không dùng Next.js 14**, đã bị chính Next.js team và `@opennextjs/cloudflare` ngừng hỗ trợ từ Q1/2026 | Server Component mặc định, phù hợp yêu cầu "đáp án chỉ ở Server" |
| UI | TailwindCSS + shadcn/ui | Tốc độ dựng UI nhanh cho vibecode, dễ theme mobile-first |
| Database + Auth | Supabase (PostgreSQL + RLS + Auth) | RLS chặn truy cập đáp án ở tầng DB, không chỉ tầng code |
| Hosting | Cloudflare Pages (`@opennextjs/cloudflare`) | Free tier hào phóng, phù hợp Giai đoạn 1 chi phí ~0đ |
| File tĩnh | Cloudflare R2 | Lưu banner, video thumbnail, tài liệu pháp quy |
| Thanh toán | VietQR tĩnh + SePay/Casso webhook | Không cần đăng ký merchant (MoMo/VNPay), phù hợp cá nhân |
| PWA | `@ducanh2912/next-pwa` (đã dùng thực tế thay vì next-pwa gốc — tương thích tốt hơn với App Router) | Học viên thêm vào màn hình chính, dùng như app |
| Theme màu | Xanh lá đậm (`#1B4D3E`) + vàng đồng (`#C9A227`) làm accent, nền off-white — phong cách trang trọng kiểu đào tạo chính quy, không màu mè | Đã chốt sau khi thấy bản theme mặc định shadcn/ui quá đơn điệu |
| Chống pause Supabase | Cloudflare Worker + Cron Trigger (ping hàng ngày) | Free tier Supabase tự pause khi không hoạt động — bài học từ dự án Tây Hồ |
| Vibecode tool | Google Antigravity | Nhận prompt thiết kế trực tiếp từ tài liệu này |
| Code base khởi điểm | Cân nhắc template GitHub free: `Razikus/supabase-nextjs-template` | Đã có RLS mẫu + cấu trúc Next.js/Supabase sẵn, đỡ phải dựng từ đầu |

---

## 3. KHUNG WEBSITE (Sitemap / Route tree)

```text
🏠 (public)
   /                        → Landing Page
   /gioi-thieu              → Giới thiệu dự án & lộ trình học
   /ung-ho                  → Trang donate (Giai đoạn 1: KHÔNG đổi quyền lợi)

👤 (dashboard) — yêu cầu đăng nhập
   /dashboard               → Tổng quan tiến độ, streak
   /profile                 → Thông tin cá nhân, đổi mật khẩu
   /tai-khoan/lich-su       → Lịch sử học tập (không gộp lịch sử donate ở G1)

🧠 (dashboard)/on-luyen
   /on-luyen/flashcards
   /on-luyen/trac-nghiem/[chu-de]
   /on-luyen/thi-thu/[chu-de]

📺 (dashboard)/bai-giang
   /bai-giang                → Danh sách chuyên đề (card, đếm số video + bài lý thuyết)
   /bai-giang/[chuyen-de-slug] → Video + lý thuyết của đúng chuyên đề đó
                                 (lý thuyết khóa tuần tự theo thu_tu, cần tích
                                 "đã đọc xong" mới mở bài kế tiếp)

📁 (dashboard)/tai-lieu
   /tai-lieu/tra-cuu
   /tai-lieu/chuyen-de

⚙️ (admin) — role = admin
   /admin/ngan-hang-de
   /admin/duyet-giao-dich   → Chỉ đối soát donate thủ công nếu webhook lỗi
   /admin/bao-cao
```

**Giai đoạn 2 bổ sung:**
```text
💳 (dashboard)/goi-thue-bao
   /goi-thue-bao            → Chọn gói (tháng/quý/năm), lịch sử thanh toán
```

Mỗi submenu là 1 route riêng với `page.tsx`, `error.tsx`, `loading.tsx` cô lập — giữ nguyên nguyên tắc bản v3.0.

---

## 4. QUY TẮC KIẾN TRÚC BẮT BUỘC

1. **Mobile-first**: responsive từ 375px, sidebar → Hamburger trên mobile.
2. **Server Component ưu tiên**: chỉ dùng Client Component cho phần tương tác thực sự cần (form, timer thi thử).
3. **Không query DB trong UI component** — mọi truy vấn đi qua Service Layer.
4. **Đáp án & giải thích chỉ tồn tại phía Server**:
   - Client chỉ nhận `id`, `noi_dung`, `cac_lua_chon`.
   - Chấm điểm bắt buộc qua Server Action, không trả `dap_an_dung` về client dưới bất kỳ hình thức nào (kể cả ẩn trong props).
5. **RLS là lớp phòng thủ thứ hai**, không thay thế việc kiểm soát ở Service Layer — áp dụng cả hai.
6. **Donate và Subscription là hai bảng/luồng độc lập** ở cấp schema (xem mục 5), tránh vô tình nối logic mở khóa vào donate trong lúc code nhanh (vibecode dễ mắc lỗi này).
7. **PWA**: manifest + service worker từ Phase 0, không để tới cuối mới thêm.
8. **Cô lập module theo thư mục, cấm import chéo** — mỗi menu chính có `lib/modules/<ten-module>/` riêng (vd: `on-luyen/`, `tai-lieu/`, `ung-ho/`), chỉ đặt trong `lib/shared/` những gì thực sự dùng chung (vd kiểu `HocVien`). Lý do: khi vibecode nhanh, AI rất dễ tiện tay import thẳng logic module này vào module khác, sinh lỗi khó truy vết khi 1 module đổi.
9. **Menu là cấu hình, không hardcode** — sidebar đọc từ `config/menu.config.ts`, thêm menu mới = thêm 1 dòng, không sửa rải rác nhiều file.
10. **Commit riêng từng module sau khi test xong** — không gộp nhiều module vào 1 commit, để dễ revert nếu Antigravity làm hỏng module sau mà không phát hiện ngay.
11. **Rà lại cột trong mọi ràng buộc `unique(...)` trước khi chạy migration** — hỏi rõ "constraint này nên theo cột nào" thay vì để AI đoán, đặc biệt với bảng có nhiều foreign key (vd `ket_qua_thi`, `ung_ho`) — đây là loại lỗi âm thầm nhất, không báo lỗi ngay mà chỉ lộ ra khi dữ liệu bị ghi đè sai.

---

## 5. DATABASE SCHEMA (Supabase)

```sql
-- Học viên
create table hoc_vien (
  id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  email text unique not null,
  ho_ten text not null,
  loai_tai_khoan text default 'free' check (loai_tai_khoan in ('free', 'vip', 'admin')),
  vip_het_han timestamptz, -- chỉ dùng từ Giai đoạn 2
  created_at timestamptz default now()
);
alter table hoc_vien enable row level security;
create policy "tu_xem_thong_tin" on hoc_vien for select using (auth.uid() = id);
-- KHÔNG có policy INSERT/UPDATE cho client — dòng hoc_vien chỉ được tạo qua
-- trigger public.handle_new_user() (security definer) gắn trên auth.users,
-- xem Phase 2 đã triển khai thực tế ở mục 9.

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
alter table ung_ho enable row level security;
create policy "xem_ung_ho_cong_khai" on ung_ho for select using (cong_khai = true);
-- KHÔNG có policy INSERT/UPDATE cho anon/authenticated — chỉ webhook (service role) ghi bảng này.

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
alter table ket_qua_thi enable row level security;
create policy "hoc_vien_xem_ket_qua" on ket_qua_thi for select using (hoc_vien_id = auth.uid());
-- KHÔNG có policy INSERT cho client — chấm điểm/ghi kết quả chỉ qua Server Action (service role).

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
alter table goi_thue_bao enable row level security;
create policy "hoc_vien_xem_goi_thue_bao" on goi_thue_bao for select using (hoc_vien_id = auth.uid());

-- Học liệu tĩnh (Phase 3, đã triển khai)
create table danh_muc_chuyen_de (
  id uuid primary key default gen_random_uuid(),
  ten text not null unique,
  slug text not null unique,
  mo_ta text,
  thu_tu integer default 0
);
alter table danh_muc_chuyen_de enable row level security;
create policy "xem_chuyen_de_cong_khai" on danh_muc_chuyen_de for select using (true);

create table bai_giang_video (
  id uuid default gen_random_uuid() primary key,
  tieu_de text not null,
  mo_ta text,
  youtube_id text not null,
  chuyen_de_id uuid references danh_muc_chuyen_de(id),
  thu_tu integer not null default 0,
  created_at timestamptz default now()
);
alter table bai_giang_video enable row level security;
create policy "xem_video_cong_khai" on bai_giang_video for select using (true);

create table bai_giang_ly_thuyet (
  id uuid default gen_random_uuid() primary key,
  tieu_de text not null,
  noi_dung_markdown text not null,
  hinh_anh_url text,
  chuyen_de_id uuid references danh_muc_chuyen_de(id),
  thu_tu integer not null default 0,
  created_at timestamptz default now()
);
alter table bai_giang_ly_thuyet enable row level security;
create policy "xem_ly_thuyet_cong_khai" on bai_giang_ly_thuyet for select using (true);

-- Tiến độ học lý thuyết (khóa tuần tự theo thu_tu trong cùng chuyên đề)
create table tien_do_hoc_lieu (
  id uuid default gen_random_uuid() primary key,
  hoc_vien_id uuid references auth.users(id) on delete cascade not null,
  bai_ly_thuyet_id uuid references bai_giang_ly_thuyet(id) on delete cascade not null,
  da_hoan_thanh boolean default false,
  ngay_hoan_thanh timestamptz,
  unique(hoc_vien_id, bai_ly_thuyet_id)
);
alter table tien_do_hoc_lieu enable row level security;
create policy "xem_tien_do_cua_minh" on tien_do_hoc_lieu for select using (auth.uid() = hoc_vien_id);
create policy "tao_tien_do_cua_minh" on tien_do_hoc_lieu for insert with check (auth.uid() = hoc_vien_id);
create policy "sua_tien_do_cua_minh" on tien_do_hoc_lieu for update using (auth.uid() = hoc_vien_id) with check (auth.uid() = hoc_vien_id);
```

**Lưu ý**: cột `chuyen_de` ở `bai_giang_video`/`bai_giang_ly_thuyet` ban đầu là kiểu `text` tự do (Phase 3), sau đó đổi sang `chuyen_de_id` tham chiếu `danh_muc_chuyen_de` (Phase 3.2) để tránh gõ tay tên chuyên đề lặp lại ở nhiều bảng — bảng `cau_hoi` ở Phase 4 cũng nên tham chiếu `chuyen_de_id` này thay vì tự có cột `chuyen_de` riêng.

---

## 6. QUY TRÌNH THANH TOÁN

### Giai đoạn 1 — Donate thuần túy
1. Học viên (hoặc khách ẩn danh) vào `/ung-ho`.
2. Chọn mức ủng hộ (preset hoặc tự nhập) → hệ thống sinh mã QR VietQR tĩnh, nội dung `UNGHO {ma_giao_dich}`.
3. SePay/Casso bắt giao dịch ngân hàng → gửi webhook `POST /api/webhook/ung-ho`.
4. Route Handler xác thực chữ ký webhook → cập nhật `trang_thai = 'thanh_cong'` trong bảng `ung_ho`.
5. **Không có bước cộng quyền lợi nào xảy ra** — chỉ hiển thị lời cảm ơn + (tùy chọn) thêm vào "Bảng vàng ủng hộ".

### Giai đoạn 2 — Subscription
1. Học viên vào `/goi-thue-bao`, chọn gói.
2. Sinh mã QR riêng, nội dung `VIP {ma_giao_dich}`.
3. Webhook `POST /api/webhook/goi-thue-bao` (route **khác** với donate) xác nhận thanh toán.
4. Server cập nhật `hoc_vien.loai_tai_khoan = 'vip'` và `vip_het_han`.
5. Middleware kiểm tra `vip_het_han` mỗi request tới route giới hạn tính năng.

Việc tách 2 webhook route là cố ý — tránh một lỗi logic ở Giai đoạn 1 vô tình cấp quyền VIP.

---

## 7. LỘ TRÌNH TRIỂN KHAI — SẮP THEO ĐỘ KHÓ (DỄ TRƯỚC, KHÓ SAU)

### Nhóm A — Nền tảng (dễ nhất)

| Phase | Nội dung | Vì sao xếp ở nhóm dễ |
|---|---|---|
| 1 ✅ | Khởi tạo hạ tầng: clone template, chạy schema SQL, deploy Cloudflare Pages, cấu hình PWA (manifest + service worker), Cloudflare Cron chống pause, thêm Postgres grants tường minh cho PostgREST | Thuần cấu hình, không có logic nghiệp vụ, sai thì dễ sửa lại từ đầu |
| 2 ✅ | Auth & điều hướng: đăng ký (bắt buộc xác thực email), đăng nhập, đổi mật khẩu, profile, sidebar đọc từ `menu.config.ts`, hamburger mobile | Dùng gần như nguyên bản tính năng có sẵn của Supabase Auth + shadcn/ui, ít logic tự viết |
| 3 ✅ | Học liệu tĩnh: `/bai-giang/video` (nhúng YouTube unlisted), `/bai-giang/ly-thuyet` (nội dung markdown, ảnh minh họa, khóa tuần tự qua `tien_do_hoc_lieu`) | Chỉ hiển thị nội dung, không chấm điểm, không RLS phức tạp |
| 3.2 🔄 | Danh mục chuyên đề dùng chung (`danh_muc_chuyen_de`), gộp `/bai-giang` thành trang chọn chuyên đề → xem nội dung | Dọn dẹp trước khi Phase 4 cần dùng chung `chuyen_de_id` |

### Nhóm B — Nội dung & tương tác (trung bình)

| Phase | Nội dung | Điểm khó |
|---|---|---|
| 4 | Ngân hàng câu hỏi + import Excel (admin): parser Excel → bảng `cau_hoi`, validate cột `van_ban_tham_chieu`/`dieu_khoan` không rỗng | Cần viết logic parse + validate dữ liệu, sai sót ở đây ảnh hưởng toàn bộ nội dung sau |
| 5 | Ôn luyện: trắc nghiệm theo chuyên đề, chấm ngay từng câu qua Server Action, hiện giải thích có trích dẫn | Phải đảm bảo đáp án không lộ qua props/network dù chấm ngay lập tức |
| 6 | Flashcard + Leitner (lặp lại ngắt quãng đơn giản: đúng → giãn chu kỳ, sai → rút ngắn) | Cần bảng theo dõi tiến độ từng thẻ mỗi học viên, logic lịch lặp lại |
| 7 | Donate (Giai đoạn 1): `/ung-ho`, sinh QR, webhook SePay/Casso xác nhận | Webhook + xác thực chữ ký là phần dễ sai bảo mật nhất trong nhóm này |

### Nhóm C — Phức tạp hơn (khó)

| Phase | Nội dung | Điểm khó |
|---|---|---|
| 8 | Thi thử: chọn câu theo đúng tỷ lệ chuyên đề của đề thật, tính giờ, nộp 1 lần, chấm toàn bộ, lưu `ket_qua_thi` | Quản lý state phía client trong lúc thi + đảm bảo không gửi đáp án từng câu về server sớm |
| 9 | Tra cứu pháp luật có vòng đời hiệu lực: bảng `van_ban_phap_luat`, liên kết `cau_hoi.van_ban_id`, cảnh báo khi văn bản hết hiệu lực | Mô hình dữ liệu phức tạp nhất — cần đồng bộ giữa văn bản và câu hỏi tham chiếu |
| 10 | AI (nếu triển khai): trợ lý trả lời câu hỏi nghiệp vụ, có trích dẫn | Rủi ro cao nhất về tính chính xác pháp lý — cần cơ chế "không chắc thì từ chối trả lời" thay vì bịa |

### Nhóm D — Giai đoạn 2 (khó nhất, chỉ làm khi có nhu cầu thực tế)

| Phase | Nội dung | Điểm khó |
|---|---|---|
| 11 | Subscription: `/goi-thue-bao`, webhook riêng biệt với donate, middleware kiểm tra `vip_het_han`, gỡ giới hạn tính năng | Phải tuyệt đối không tái sử dụng logic/webhook của donate — rủi ro cấp nhầm quyền VIP |

---

## 8. THÔNG TIN CẦN CHUẨN BỊ TRƯỚC KHI VIBECODE

1. Banner trang chủ (không chèn mã QR) — text: *"Đào tạo chuẩn hóa nghiệp vụ hải quan khóa 02 năm 2026"*.
2. File Excel mẫu câu hỏi để viết tool import — kiểm tra kỹ số Điều/Khoản trong cột giải thích (vd: Nghị định 167 không có 14 điều, Thông tư 121 chỉ có 3 điều).
3. Bộ tài liệu pháp quy trọng tâm (việc làm, hải quan...) để xử lý trích xuất.
4. Thông tin tài khoản ngân hàng nhận donate + đăng ký SePay/Casso.

---

## 9. PROMPT ĐƯA VÀO ANTIGRAVITY — THEO TỪNG PHASE

Nguyên tắc chung nhắc lại đầu mỗi prompt: không query DB trong UI, đáp án chỉ ở Server, Server Component mặc định, mobile-first, cô lập module theo `lib/modules/<ten>/`, menu đọc từ `config/menu.config.ts`, commit riêng sau khi test xong module đó.

### Phase 1 — Khởi tạo hạ tầng
```
Khởi tạo project Next.js 15 (hoặc 16 nếu ổn định) App Router + TypeScript strict + TailwindCSS + shadcn/ui.
KHÔNG dùng Next.js 14 — đã bị Next.js team và @opennextjs/cloudflare ngừng hỗ trợ từ Q1/2026.
Cấu hình Supabase (schema mục 5), thêm Postgres grants tường minh cho PostgREST
(bắt buộc với dự án tạo sau 30/5/2026). Cấu hình PWA (manifest.json + service worker).
Deploy thử lên Cloudflare Pages qua @opennextjs/cloudflare. Viết 1 Cloudflare Worker
+ Cron Trigger ping Supabase hàng ngày để chống tự pause do free tier.
Không viết bất kỳ route hay bảng nghiệp vụ nào khác ở phase này.
```

### Phase 2 — Auth & điều hướng cốt lõi
```
Dùng Supabase Auth (email + password). Bắt buộc xác thực email trước khi truy cập
/on-luyen hoặc /on-luyen/thi-thu. Tạo trigger tự sinh record hoc_vien khi user xác
thực xong. Làm /profile (đổi mật khẩu), sidebar đọc từ config/menu.config.ts,
chuyển thành hamburger drawer dưới 768px. Không hardcode danh sách menu trong
component sidebar.
```

### Phase 3 — Học liệu tĩnh
```
Làm /bai-giang/video (nhúng YouTube unlisted qua iframe) và /bai-giang/ly-thuyet
(nội dung markdown tĩnh, Server Component render). Không cần bảng DB phức tạp —
có thể lưu nội dung dạng file markdown trong repo hoặc 1 bảng đơn giản
bai_giang(id, tieu_de, noi_dung, loai).
```

### Phase 4 — Ngân hàng câu hỏi + import Excel
```
Viết tool admin import câu hỏi từ Excel vào bảng cau_hoi theo cấu trúc:
chuyen_de | noi_dung | 4 lựa chọn | dap_an_dung | van_ban_tham_chieu | dieu_khoan
| giai_thich | do_kho. Validate bắt buộc: van_ban_tham_chieu và dieu_khoan không
được rỗng. Dòng lỗi validate phải hiện danh sách rõ ràng cho admin sửa, không
import ngầm rồi bỏ qua lỗi.
```

### Phase 5 — Ôn luyện
```
Route /on-luyen/trac-nghiem/[chu-de]: hiện câu hỏi qua view cau_hoi_public
(không bao giờ query bảng cau_hoi gốc từ client). Chấm từng câu ngay qua Server
Action, trả về đúng/sai + giai_thich + trích dẫn dieu_khoan sau khi học viên chọn.
Không tính giờ, không giới hạn số lần làm lại.
```

### Phase 6 — Flashcard (Leitner)
```
Bảng flashcard_tien_do(hoc_vien_id, cau_hoi_id, hop_so, ngay_on_lai_tiep_theo).
Thuật toán Leitner đơn giản: trả lời đúng → tăng hop_so, giãn ngay_on_lai_tiep_theo
xa hơn; trả lời sai → hop_so về 1, ngay_on_lai_tiep_theo = hôm sau. Route
/on-luyen/flashcards chỉ lấy thẻ có ngay_on_lai_tiep_theo <= hôm nay.
```

### Phase 7 — Donate (Giai đoạn 1)
```
Route /ung-ho: sinh QR VietQR tĩnh, nội dung "UNGHO {ma_giao_dich}". Webhook
POST /api/webhook/ung-ho nhận từ SePay/Casso, PHẢI xác thực chữ ký trước khi
cập nhật trang_thai. Không đụng tới bảng hoc_vien hay loai_tai_khoan trong toàn
bộ phase này.
```

### Phase 8 — Thi thử
```
Route /on-luyen/thi-thu/[chu-de]: Server Action chọn ngẫu nhiên câu hỏi đúng tỷ
lệ chuyên đề đã cấu hình. Client chỉ giữ câu trả lời tạm trong state, KHÔNG gửi
từng câu về server. Có đồng hồ đếm ngược; hết giờ tự động nộp. Nộp bài (thủ công
hoặc tự động) gửi toàn bộ câu trả lời 1 lần qua Server Action duy nhất, chấm và
lưu ket_qua_thi, trả kết quả kèm giải thích.
```

### Phase 9 — Tra cứu pháp luật có vòng đời hiệu lực
```
Bảng van_ban_phap_luat(ten_van_ban, so_hieu, ngay_ban_hanh, ngay_het_hieu_luc,
trang_thai). Liên kết cau_hoi.van_ban_id → van_ban_phap_luat.id. Route admin
hiện danh sách câu hỏi có văn bản đã hết hiệu lực để rà soát cập nhật, không tự
động ẩn câu hỏi mà chỉ cảnh báo cho admin duyệt tay.
```

### Phase 10 — AI (nếu triển khai)
```
Trợ lý AI (Gemini API) chỉ trả lời dựa trên nội dung trong van_ban_phap_luat và
cau_hoi đã có trong hệ thống, luôn kèm trích dẫn nguồn. Nếu không tìm thấy căn cứ
rõ ràng, trả lời "chưa đủ căn cứ, cần admin xác nhận" thay vì tự suy diễn.
```

### Phase 11 — Subscription (Giai đoạn 2, chỉ làm khi có nhu cầu thực tế)
```
Route /goi-thue-bao. Webhook POST /api/webhook/goi-thue-bao TÁCH BIỆT hoàn toàn
với /api/webhook/ung-ho — không tái sử dụng cùng handler. Chỉ webhook này được
phép cập nhật hoc_vien.loai_tai_khoan = 'vip' và vip_het_han. Middleware kiểm
tra vip_het_han ở các route giới hạn tính năng.
```

---

## 10. RÚT KINH NGHIỆM TỪ DỰ ÁN NỘI BỘ TÂY HỒ (đã tích hợp vào bản này)

Dự án web nội bộ TTVT Tây Hồ dùng chung stack (Next.js + Supabase + Antigravity) và đã phát sinh lỗi khi vibecode. Các bài học đã được đưa thẳng vào mục 2, 4, 7 ở trên; tóm tắt lại đây để bạn đối chiếu khi review code Antigravity trả về:

| Vấn đề gặp ở Tây Hồ | Cách phòng ở dự án này |
|---|---|
| Ràng buộc `unique()` bị AI gán nhầm cột (constraint theo `to_id` thay vì `nhan_vien_id`) — lỗi không báo ngay, chỉ lộ khi dữ liệu ghi đè sai | Quy tắc 11 (mục 4): tự tay rà lại từng `unique(...)` trước khi chạy migration, không để Antigravity tự quyết |
| Không cô lập module → sửa 1 chỗ ảnh hưởng chỗ khác khi vibecode nhanh | Quy tắc 8: `lib/modules/<ten>/` riêng biệt, cấm import chéo (bổ sung mới, bản v3.0 chưa có) |
| Hardcode menu rải rác nhiều file | Quy tắc 9: `config/menu.config.ts` tập trung |
| Gộp nhiều thay đổi vào 1 commit → khó revert khi module sau làm hỏng module trước | Quy tắc 10: commit riêng từng module sau khi test |
| Supabase free tier tự pause vì không có traffic đều | Đã thêm Cloudflare Cron Trigger ping hàng ngày vào mục 2 |
| Storage bucket "public" chỉ cho đọc công khai, không tự cấp quyền ghi — dễ gặp lỗi "new row violates row-level security policy" khi upload nếu quên thêm policy insert/delete riêng | Khi làm Storage cho banner (R2) và tài liệu pháp quy: nhớ viết policy insert/delete riêng cho từng bucket, không mặc định public = ghi được |

Điểm khác biệt quan trọng: dự án Tây Hồ có 50 người dùng nội bộ nên phần bảo mật đăng nhập (mật khẩu mặc định ngẫu nhiên, MFA cho vai trò quản lý, giới hạn đăng nhập sai) rất quan trọng. Dự án Hải Quan là học viên tự đăng ký công khai, nên rủi ro đó không áp dụng — nhưng vẫn nên giữ: giới hạn số lần đăng nhập sai (rate limiting có sẵn trong Supabase) để chặn dò mật khẩu tự động, và ghi log đăng nhập cho vai trò `admin`.

---

## 11. BÀI HỌC THỰC TẾ TỪ CHÍNH DỰ ÁN NÀY (cập nhật sau Phase 1-3)

| Vấn đề gặp phải | Nguyên nhân | Cách phòng cho các Phase sau |
|---|---|---|
| Next.js 14 không dùng được | Đã bị Next.js team và `@opennextjs/cloudflare` ngừng hỗ trợ từ Q1/2026 | Dùng Next.js 15/16 — đã sửa ở mục 2 |
| `npx wrangler pages deploy` không đúng cho `@opennextjs/cloudflare` | Adapter này build ra 1 Cloudflare Worker, không phải static output kiểu Pages cũ — không có khái niệm "Build output directory" | Deploy qua GitHub + Cloudflare **Workers Builds** (chọn "Workers", không chọn tab "Pages"), điền Build command / Deploy command (`npx wrangler deploy`), không điền output directory |
| Đăng ký tài khoản nhưng bảng `hoc_vien` không tự sinh dòng | Trigger `handle_new_user()` thiếu `security definer set search_path = ''` — bị RLS chặn khi insert | Mọi trigger ghi vào bảng có RLS chặt phải khai báo `security definer` |
| Bấm link xác thực email → trang báo lỗi | Email template mặc định của Supabase không khớp với route `/auth/callback` viết theo kiểu PKCE (`exchangeCodeForSession`) | Đổi email template "Confirm signup" sang `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`, route đọc `token_hash`+`type` rồi gọi `verifyOtp()` |
| Next.js 16 đổi tên `middleware.ts` → `proxy.ts` | Thay đổi chính thức của Next.js 16, không phải lỗi | Nhớ dùng đúng tên file `proxy.ts` và export hàm tên `proxy` từ Phase 2 trở đi |
| Ảnh từ domain ngoài (`picsum.photos`) có thể lỗi khi dùng `next/image` | Next.js chặn domain ảnh lạ nếu chưa khai báo | Khai báo `images.remotePatterns` trong `next.config` cho mọi domain ảnh ngoài dùng thật (thay placeholder) |
| Giao diện mặc định shadcn/ui quá đơn điệu | Chưa có theme riêng | Đã chốt theme xanh lá đậm + vàng đồng (mục 2), áp dụng qua CSS variables, không hardcode màu rải rác |
