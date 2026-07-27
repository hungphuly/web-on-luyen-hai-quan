# VIBECODE_RULES.md — Web Ôn Luyện Hải Quan

Tài liệu này là **nguồn quy tắc duy nhất** cho mọi phiên làm việc với Antigravity. Dán/đính kèm file này (hoặc phần liên quan) ở đầu mỗi prompt lớn. Khi có mâu thuẫn giữa trí nhớ của AI và file này — **file này thắng**.

---

## 1. Nguyên tắc tổng quát (không thương lượng)

1. **Đáp án & giải thích chỉ tồn tại phía Server.** Client không bao giờ nhận `dap_an_dung`, `giai_thich_chi_tiet`, `can_cu_phap_ly` của câu hỏi trước khi nộp bài — kể cả ẩn trong props, kể cả trong ngữ cảnh gửi cho AI (xem mục AI ở `AI_ADMIN.md`).
2. **Server Component mặc định.** Chỉ dùng Client Component khi thực sự cần tương tác (form, timer, toggle).
3. **Không query DB trong UI component.** Mọi truy vấn đi qua Service Layer (`lib/modules/<ten>/services/`).
4. **RLS là lớp phòng thủ thứ hai, không phải lớp duy nhất.** Luôn kiểm soát ở cả Service Layer lẫn RLS — không tin tưởng tuyệt đối vào 1 trong 2.
5. **Mobile-first**, responsive từ 375px.

## 2. Cấu trúc thư mục — cô lập module

- Mỗi tính năng chính = 1 thư mục riêng: `lib/modules/<ten-module>/` (vd `on-luyen/`, `thi-thu/`, `flashcard/`, `bai-giang/`, `ngan-hang-de/`, `ung-ho/`, `ai-assistant/`).
- **Cấm import chéo** giữa các module — kể cả khi logic giống nhau, copy riêng hoặc tách ra `lib/shared/` nếu thực sự dùng chung (vd kiểu `HocVien`).
- **Lý do**: khi vibecode nhanh, AI rất dễ tiện tay import thẳng logic module này vào module khác, sinh lỗi khó truy vết khi 1 module đổi mà không biết ảnh hưởng module kia.
- Menu là cấu hình: `config/menu.config.ts` — sidebar đọc từ đây, không hardcode danh sách menu trong component.
- **Ôn luyện và Thi thử là 2 module riêng biệt** dù logic có phần giống nhau (đã từng lẫn lộn cỡ chữ giữa 2 trang vì code ở 2 Phase khác nhau) — nếu cần đồng bộ giao diện, dùng chung 1 bộ class Tailwind khai báo tường minh, không copy-paste rồi để lệch dần.

## 3. Quy tắc dữ liệu (Database)

### 3.1 Rà lại MỌI ràng buộc `unique(...)` trước khi chạy migration
Đây là loại lỗi **âm thầm nhất** — không báo lỗi ngay, chỉ lộ ra khi dữ liệu bị ghi đè sai (bài học từ dự án Tây Hồ: `unique()` gán nhầm cột `to_id` thay vì `nhan_vien_id`). Luôn tự hỏi "constraint này nên theo (những) cột nào" trước khi tin AI tự quyết.

### 3.2 RLS bắt buộc cho MỌI bảng chứa dữ liệu người dùng
- Bật `enable row level security` ngay khi tạo bảng, không để "làm sau".
- Bảng có dữ liệu nhạy cảm (đáp án, tiền, kết quả thi): **không có policy nào cho client** ngoài SELECT giới hạn — mọi INSERT/UPDATE đi qua Server Action dùng `service_role` (`createAdminClient()`), không cho phép client tự ghi.
- Bảng dữ liệu cá nhân của học viên (tiến độ flashcard, lịch sử ôn luyện, kết quả thi): policy dạng `auth.uid() = hoc_vien_id`, không thêm UPDATE/DELETE nếu là dạng log (chỉ SELECT + INSERT).
- Bảng admin-managed dùng chung 1 pattern:
  ```sql
  create policy "chi_admin_toan_quyen" on <bang> for all
    using (exists (select 1 from hoc_vien where id = auth.uid() and loai_tai_khoan = 'admin'))
    with check (exists (select 1 from hoc_vien where id = auth.uid() and loai_tai_khoan = 'admin'));
  ```

### 3.3 Ẩn cột nhạy cảm bằng VIEW, không bằng policy cột
RLS Postgres lọc theo **dòng**, không lọc theo **cột**. Muốn ẩn cột đáp án khỏi client: tạo 1 VIEW chỉ chọn cột an toàn (`cau_hoi_public`), KHÔNG cấp SELECT trên bảng gốc cho client. View sẽ hiện nhãn cảnh báo "Security Definer view" trên Supabase Dashboard — **đây là chủ đích, không phải lỗi**, không tự ý bật `security_invoker` (sẽ làm view áp RLS bảng gốc, học viên sẽ không lấy được gì cả vì bảng gốc không có policy select cho họ).

### 3.4 Trigger ghi vào bảng có RLS chặt PHẢI khai báo `security definer`
```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$ ... $$;
```
Thiếu dòng này → trigger bị chính RLS chặn, đăng ký tài khoản sẽ lỗi (bug thật đã gặp ở Phase 2).

### 3.5 Tối ưu bảng log/lịch sử ngay từ đầu, đừng đợi tới khi dữ liệu lớn
Với tính năng sinh nhiều dòng theo hành vi người dùng (mỗi câu trả lời, mỗi lượt xem...): cân nhắc ngay từ đầu giữa lưu **chi tiết từng sự kiện** hay **tổng hợp theo phiên/ngày**. Bài học: ban đầu lưu `lich_su_on_luyen` chi tiết từng câu, sau đổi sang tổng hợp theo phiên (`phien_on_luyen`: `so_cau_da_lam`, `so_cau_dung`) vì lo ngại 100-1000 user sẽ sinh hàng chục nghìn dòng/ngày, chạm giới hạn 500MB DB free tier. Quy tắc: nếu tính năng có khả năng nhân lên theo (số user × số hành động/ngày) mà không cần xem lại chi tiết lâu dài, ưu tiên tổng hợp ngay, không lưu chi tiết "phòng khi cần".

## 4. Quy tắc Auth

1. **Email xác thực**: dùng `token_hash` + `type`, gọi `supabase.auth.verifyOtp()` — KHÔNG dùng `exchangeCodeForSession(code)` trừ khi đã đổi đúng email template sang `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`. Sai chỗ này → học viên bấm link xác thực bị lỗi ngay (đã gặp thật).
2. **Điểm redirect sau đăng nhập/xác thực**: chỉ 1 nguồn sự thật, đổi ở 1 chỗ khi cần thay đổi (đã từng bug vì đổi cấu trúc trang chủ nhưng quên cập nhật redirect, khiến login luôn về `/profile` cũ).
3. **Next.js 16**: file middleware đổi tên thành `proxy.ts`, hàm export tên `proxy` (không phải `middleware`) — đây là thay đổi chính thức của framework, không phải lỗi.
4. **Reset password / quên mật khẩu**: dùng cùng cơ chế `token_hash` như xác thực email, không dùng lại `exchangeCodeForSession`.

## 5. Quy tắc Deploy & Hạ tầng

1. **Next.js**: dùng bản 15 hoặc 16, KHÔNG dùng 14 (Next.js team và `@opennextjs/cloudflare` đã ngừng hỗ trợ 14 từ Q1/2026).
2. **Deploy**: `@opennextjs/cloudflare` build ra 1 **Cloudflare Worker**, không phải static output kiểu Pages cũ. Khi kết nối GitHub → chọn **"Workers"** (Workers Builds), KHÔNG chọn tab "Pages". Điền **Build command** / **Deploy command** (`npx wrangler deploy`) — không có khái niệm "Build output directory" cho kiểu deploy này.
3. **`wrangler.toml`** bắt buộc có `compatibility_flags: ["nodejs_compat"]` và `compatibility_date` là ngày hiện tại trở lên.
4. **Package lock file**: sau khi thêm bất kỳ dependency mới nào, đảm bảo `package-lock.json` đồng bộ (`npm install` lại) TRƯỚC khi push — Cloudflare Workers Builds chạy `npm ci`, sẽ lỗi cứng nếu lock file không khớp `package.json`.
5. **Biến môi trường**: tuyệt đối không thêm tiền tố `NEXT_PUBLIC_` cho secret key (service role key, API key). Sau khi thêm biến môi trường mới vào `.env.local`, **bắt buộc restart** `npm run dev` — Next.js không tự đọc biến mới khi server đang chạy.
6. **Region Supabase**: chọn kỹ ngay từ đầu (Singapore cho người dùng VN) — Supabase **không cho đổi region** của project đã tạo, phải tạo project mới + chuyển toàn bộ schema/data nếu chọn nhầm.
7. **Chống pause Supabase free tier**: 1 Cloudflare Worker + Cron Trigger ping 1 lần/ngày (không cần dày hơn, ping mỗi phút là lãng phí không cần thiết).
8. **Dự án tạo sau 30/5/2026** cần thêm Postgres grants tường minh cho PostgREST API, nếu không API tự sinh của Supabase sẽ không trả dữ liệu dù RLS đã đúng.

## 6. Quy tắc xác nhận — "Antigravity báo xong" KHÔNG đồng nghĩa đã xong

Đã nhiều lần Antigravity báo "đã hoàn thành" nhưng thực tế: code chỉ tồn tại ở local (chưa `git push`), file không tồn tại thật, hoặc tính năng chưa thực sự nối vào menu. Quy tắc bắt buộc:

1. **Không tin báo cáo bằng chữ** — luôn tự bấm thử tính năng trên trình duyệt (local hoặc bản deploy) trước khi coi là xong.
2. Khi nghi ngờ, yêu cầu Antigravity đưa **bằng chứng thật**: kết quả lệnh `git status`, `git log --oneline`, `git push`, hoặc liệt kê thư mục thật (không phải mô tả bằng lời).
3. Với thay đổi cần deploy: xác nhận cả 3 bước — `commit` → `push` → Cloudflare **Deployments** hiện bản mới **Success** — thiếu 1 bước là chưa lên bản thật.
4. Sau khi sửa lỗi 1 lần mà vẫn tái diễn (2 lần trở lên): yêu cầu Antigravity **debug và giải thích nguyên nhân trước**, không cho sửa mò lần nữa.

## 7. Quy tắc giới hạn tài nguyên (Free tier người dùng)

- Tài khoản `free`: giới hạn số lượt thi thử/ngày và số lượt hỏi AI/ngày (đếm trực tiếp từ dữ liệu đã có khi có thể — vd đếm `ket_qua_thi` theo ngày thay vì tạo bảng đếm riêng — chỉ tạo bảng đếm mới khi thực sự không có sẵn dữ liệu để đếm, như trường hợp AI không lưu nội dung chat).
- Tài khoản `admin` không bị giới hạn.
- Luôn hiện rõ cho học viên biết "còn bao nhiêu lượt hôm nay" thay vì chặn im lặng.

## 8. Bảng tổng hợp bài học thực tế (cập nhật liên tục)

| Vấn đề | Nguyên nhân | Cách phòng |
|---|---|---|
| `unique()` sai cột (Tây Hồ) | AI tự đoán cột, không hỏi lại | Luôn rà tay trước khi migrate |
| Đăng ký xong `hoc_vien` không tự sinh | Trigger thiếu `security definer` | Luôn khai báo khi trigger ghi vào bảng RLS chặt |
| Bấm link xác thực email lỗi | Email template không khớp route callback kiểu PKCE | Dùng `token_hash` + `verifyOtp()` |
| Đăng nhập xong về sai trang | Redirect cũ không cập nhật khi đổi cấu trúc trang | Chỉ 1 nguồn sự thật cho điểm redirect |
| Deploy lỗi "Build output directory" | Nhầm Cloudflare Pages cũ với Workers Builds mới | Chọn "Workers", dùng Build/Deploy command |
| `npm ci` lỗi khi Cloudflare build | `package-lock.json` không đồng bộ `package.json` | `npm install` lại trước khi push |
| Menu 404 dù báo đã sửa | Thay đổi chỉ ở local, chưa push/deploy | Luôn xác nhận bằng git log + Cloudflare Deployments |
| Region Supabase sai (India thay vì Singapore) | Chọn nhầm lúc tạo project | Không đổi được sau — phải tạo mới; chọn kỹ ngay từ đầu |
| PWA service worker lỗi `_async_to_generator` | Lỗi build/transpile của thư viện PWA, không liên quan bảo mật | Kiểm tra cấu hình next-pwa, không hoảng nếu thấy lỗi này trong Console |
| Lo ngại bảng log phình to | Lưu chi tiết từng sự kiện thay vì tổng hợp | Thiết kế tổng hợp theo phiên/ngày ngay từ đầu nếu dữ liệu có khả năng nhân lên theo user × hành động |
| View bị gắn nhãn "Security Definer view" | Supabase cảnh báo mặc định cho mọi view bỏ qua RLS | Bình thường nếu view chỉ chọn cột an toàn — không tự ý bật `security_invoker` |

---
*Cập nhật lần cuối: sau đợt hoàn thiện Phase 1-10 + đợt sửa UI/UX lớn.*
