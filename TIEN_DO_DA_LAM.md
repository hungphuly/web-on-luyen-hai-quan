# BÁO CÁO TIẾN ĐỘ DỰ ÁN WEB ÔN LUYỆN HẢI QUAN (Dành cho Claude)

Đây là tài liệu ghi nhận chính xác những gì hệ thống Antigravity đã code xong trong kho lưu trữ hiện tại. Bạn có thể dựa vào đây để tiếp tục thiết kế và code các phase tiếp theo mà không bị giẫm chân lên code cũ.

## 🟢 CÁC PHASE ĐÃ HOÀN THÀNH (Không cần code lại)

### Phase 1 — Khởi tạo hạ tầng
- [x] Khởi tạo Next.js 14 App Router, TypeScript, TailwindCSS, shadcn/ui.
- [x] Supabase: Đã chạy thành công toàn bộ migration SQL (bao gồm tất cả các bảng: `hoc_vien`, `cau_hoi`, `ket_qua_thi`, `flashcard`, `bai_giang_video`, `van_ban_phap_luat`, `ung_ho`...) và cấu hình Row Level Security (RLS).
- [x] Đã cấu hình Server Client & Admin Client (bypass RLS) cho Next.js.

### Phase 2 — Auth & Điều hướng
- [x] Đăng nhập / Đăng ký qua Email/Password của Supabase Auth.
- [x] Đã viết Middleware bảo vệ route nội bộ, điều hướng về `/` sau khi login.
- [x] Hệ thống Layout, Sidebar, Menu hamburger trên Mobile đọc cấu hình từ `src/config/menu.config.ts`.
- [x] Trang cá nhân `/profile`.

### Phase 3 — Học liệu tĩnh
- [x] Route `/bai-giang` (chọn chuyên đề) -> Bài giảng Video (nhúng Iframe YouTube) & Lý thuyết Markdown tĩnh, tích hợp từ DB `bai_giang_video` và `bai_giang_ly_thuyet`.

### Phase 4 — Ngân hàng câu hỏi (Admin)
- [x] Module Admin tại `/admin/chuyen-de` và `/admin/ngan-hang-de`.
- [x] Đã nâng cấp bảng `cau_hoi`: cấu trúc lại `do_kho` thành dạng số (1=Dễ, 2=TB, 3=Khó), và bổ sung `phan_loai` (1=Ôn luyện, 2=Thi thử, 3=Thi thật).
- [x] Cập nhật giao diện Admin và script nhập Excel để tương thích cấu trúc mới, cung cấp sẵn file `mau_import_cau_hoi.xlsx` chuẩn.
- [x] Luồng bốc câu hỏi Frontend đã hỗ trợ phân loại (Trắc nghiệm bốc `phan_loai=1`, Thi thử bốc `phan_loai` 2 hoặc 3).

### Phase 5 — Ôn luyện Trắc nghiệm
- [x] Route `/on-luyen` (chọn chuyên đề) -> Trắc nghiệm từng câu (`/on-luyen/[slug]`).
- [x] Chấm điểm qua Server Action (`actions.ts`), đáp án được giấu kín ở Server, chỉ hiển thị giải thích sau khi người dùng chọn đáp án.

### Phase 6 — Flashcard (Leitner)
- [x] Trình học Flashcard `/flashcards` có chia hộp số Leitner, hẹn giờ ôn tập ngày kế tiếp. Bảng DB `flashcard_tien_do` đang hoạt động tốt.
- [x] Module Quản lý `/admin/flashcard`.

### Phase 8 — Thi thử
- [x] Đã hoàn thành route thi thử tự động `/on-luyen/[slug]/thi-thu`.
- [x] Tính năng bấm giờ đếm ngược, nộp toàn bộ câu trả lời, lưu vào `ket_qua_thi`.

### Phase 9 — Tra cứu pháp luật (PDF)
- [x] Trang `/tai-lieu/tra-cuu` lấy từ `van_ban_phap_luat`.
- [x] Trình xem file PDF chống tải xuống trên thiết bị di động (sử dụng thư viện `react-pdf`).
- [x] Module `/admin/tai-lieu` để quản lý văn bản, cập nhật trạng thái (Còn hiệu lực/Hết hiệu lực).

### Phase 10 — AI Assistant
- [x] Chatbot (Bong bóng chát góc phải dưới màn hình) tích hợp Gemini (`@google/genai`).
- [x] Khóa luồng tự động đếm qua bảng `ai_luot_hoi`, giới hạn 10 lượt/ngày đối với tài khoản Free. 

### Các tính năng bổ sung (Ngoài plan gốc)
- [x] Dashboard Báo Cáo Admin `/admin/bao-cao` để thống kê lượng học viên, thi thử, câu hỏi, AI chat. Đã lưu file config `AGENTS.md` (Quy định bắt buộc của dự án).

---

## 🟡 CÁC PHASE CHƯA LÀM (Cần Claude thiết kế & code tiếp)

### 1. Phase 7 — Donate (Giai đoạn 1)
- **Status:** **Mới chỉ có bảng `ung_ho` trong Supabase DB**.
- **Chưa có:** 
  - Trang frontend cho khách hàng `/ung-ho` (hiển thị mã QR VietQR tự động chứa mã `UNGHO {id}`).
  - API Webhook `/api/webhook/ung-ho` hứng dữ liệu từ SePay / Casso để đổi trạng thái sang `thanh_cong`.
  - Trang duyệt giao dịch thủ công `/admin/duyet-giao-dich`.

### 2. Báo cáo đối soát doanh thu chi tiết (Module mở rộng của Admin Báo cáo)
- **Status:** Chỉ mới hiển thị số tổng trên `/admin/bao-cao`, chưa có bảng danh sách chi tiết các lịch sử thanh toán Donate để admin kiểm tra đối chiếu.

### 3. Phase 11 — Subscription Giai đoạn 2 (Tuỳ chọn)
- **Status:** **Mới chỉ có bảng `goi_thue_bao`**.
- **Chưa có:** Chưa làm luồng khóa tính năng theo ngày hết hạn VIP (chỉ mới chia quyền theo tài khoản `free`/`admin`), chưa có webhook riêng, chưa có trang mua gói VIP.

### 4. PWA (Progressive Web App)
- **Status:** Đã lên kế hoạch nhưng chưa cấu hình thực tế file `manifest.json` và `next-pwa` trong dự án.

## LỜI KHUYÊN CHO CLAUDE TỪ ANTIGRAVITY:
- Luôn kiểm tra file `AGENTS.md` ở root project trước khi viết code (để hiểu nguyên tắc import, tên nhánh, quy định limit tài khoản).
- Remote repo sử dụng `web` thay vì `origin`.
- Nên bắt đầu ngay với việc hoàn thiện **Phase 7 - Donate**. Các logic Database đã sẵn sàng!
