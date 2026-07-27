# SECURITY.md — Web Ôn Luyện Hải Quan

Tổng hợp các quyết định bảo mật **đã thực sự áp dụng** trong dự án (không phải danh sách lý thuyết) — dùng để đối chiếu khi thêm tính năng mới.

## 1. Nguyên tắc cốt lõi

> Đáp án, giải thích, căn cứ pháp lý của câu hỏi CHỈ tồn tại phía Server. Không có ngoại lệ — kể cả khi tính năng mới (AI, thi thử, ôn luyện) trông có vẻ "chỉ cần thêm 1 chút dữ liệu".

Mọi tính năng mới trước khi code phải tự hỏi: *"Bước này có làm đáp án rời khỏi server không, dù chỉ tạm thời trong bộ nhớ client hay trong ngữ cảnh gửi cho AI?"*

## 2. RLS theo từng nhóm bảng

| Nhóm bảng | Policy | Ghi chú |
|---|---|---|
| `hoc_vien` | SELECT: chỉ dòng của chính mình. Không có INSERT/UPDATE cho client | Dòng mới tạo qua trigger `security definer` duy nhất |
| `cau_hoi` (gốc) | Không có SELECT cho client — chỉ admin `for all` | Client chỉ đọc qua view `cau_hoi_public` |
| `ung_ho`, `ket_qua_thi`, `goi_thue_bao`, `tien_do_hoc_lieu`, `flashcard_tien_do`, `phien_on_luyen` | SELECT + INSERT giới hạn `hoc_vien_id = auth.uid()`. Không UPDATE/DELETE nếu là log | Ghi qua Server Action, không cho client tự do sửa lịch sử |
| `bai_giang_video`, `bai_giang_ly_thuyet`, `danh_muc_chuyen_de`, `flashcard`, `van_ban_phap_luat` | SELECT công khai (kể cả `anon`), chỉ admin ghi | Nội dung học tập, không nhạy cảm |
| `ai_luot_hoi` | INSERT: chỉ dòng của chính mình. Không SELECT/UPDATE/DELETE từ client | Chỉ đếm quota qua Service Layer, không lộ lịch sử hỏi AI |

## 3. Ẩn dữ liệu nhạy cảm bằng VIEW

`cau_hoi_public` chỉ chọn `id, chuyen_de_id, noi_dung, cac_lua_chon` — không bao giờ thêm `dap_an_dung`/`can_cu_phap_ly` vào view này. View này cố ý bỏ qua RLS bảng gốc (nhãn "Security Definer view" trên Supabase Dashboard là **chủ đích**, không phải lỗi).

## 4. Chấm điểm — luôn qua Server Action + service role

- `chamDiemCauHoi` (ôn luyện) và `nopBaiThiThu` (thi thử): dùng `createAdminClient()` (service role, bypass RLS) CHỈ để đọc đáp án đúng trong 1 hàm duy nhất, không tái sử dụng cho mục đích khác.
- File chứa `createAdminClient()` không bao giờ có `"use client"`, không bao giờ truyền service role key xuống Client Component.
- Client trong lúc thi thử chỉ giữ câu trả lời tạm trong state trình duyệt — không gọi Server Action cho từng câu (khác ôn luyện, vốn chấm ngay từng câu).

## 5. Auth

- Email xác thực & quên mật khẩu: dùng `token_hash` + `verifyOtp()`, không dùng `exchangeCodeForSession` (dễ lỗi nếu email template không khớp).
- Trigger tạo `hoc_vien`: `security definer set search_path = ''`.
- Rate limit đăng nhập sai: dùng cơ chế có sẵn của Supabase Auth, không cần tự viết thêm.
- Chưa cần MFA cho học viên thường (khác dự án nội bộ Tây Hồ) — chỉ cân nhắc cho vai trò `admin` nếu sau này thấy cần.

## 6. AI (Gemini)

- API key (`GEMINI_API_KEY`) chỉ đọc trong Server Action, không có tiền tố `NEXT_PUBLIC_`.
- Ngữ cảnh gửi cho AI (trợ lý học viên) CHỈ lấy từ `noi_dung` + `can_cu_phap_ly` của câu hỏi — KHÔNG BAO GIỜ đưa `dap_an_dung` vào ngữ cảnh, kể cả khi học viên hỏi thẳng "đáp án câu X là gì" — System Prompt phải từ chối trả lời dạng câu hỏi đó.
- Tính năng AI soạn nội dung cho Admin (xem `AI_ADMIN.md`): luôn qua bảng nháp + admin duyệt tay, không tự động xuất bản.
- Giới hạn số lượt hỏi/ngày cho tài khoản free (đếm qua bảng `ai_luot_hoi`, chỉ lưu lượt không lưu nội dung).

## 7. Tài liệu (PDF) — chỉ xem, không tải

- Nhúng PDF trong trình xem riêng (iframe/thư viện xem), không có thẻ `<a>` link tải trực tiếp tới file gốc.
- **Giới hạn đã biết và chấp nhận**: không có cách nào chặn tuyệt đối việc tải xuống trên trình duyệt (người dùng luôn có thể chụp màn hình hoặc dùng công cụ dev lấy link). Đây là "gây khó hợp lý", không phải bảo mật tuyệt đối — không đầu tư thêm công cụ DRM phức tạp cho quy mô dự án hiện tại.
- File PDF lưu trên Cloudflare R2 (không dùng Supabase Storage cho file lớn — free tier Supabase chỉ có 5GB egress/tháng, dễ hết quota với file 6-7MB tải nhiều lần; R2 không tính phí egress).
- Storage bucket: nhớ tạo bucket TRƯỚC, rồi mới thêm policy `storage.objects` tham chiếu đúng `bucket_id` — thứ tự ngược lại sẽ lỗi.

## 8. Những gì CHƯA làm và CHƯA cần làm ngay

- Cloudflare WAF trả phí, Turnstile — chưa cần cho quy mô cá nhân hiện tại, cân nhắc khi có lưu lượng thật đáng kể hoặc dấu hiệu bị tấn công/spam.
- Watermark tài liệu — có thể làm sau nếu phát hiện tài liệu bị chia sẻ ngoài ý muốn, không làm trước khi có bằng chứng cần thiết.
- MFA cho admin — cân nhắc nếu có nhiều admin hoặc dấu hiệu bị dò mật khẩu.
- Đóng gói SaaS đa tổ chức — không làm trừ khi có nhu cầu thật từ 1 tổ chức khác muốn dùng chung nền tảng.

---
*Đây là tài liệu sống — cập nhật mỗi khi có quyết định bảo mật mới, không viết 1 lần rồi để đó.*
