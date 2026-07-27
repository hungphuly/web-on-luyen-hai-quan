# AI_ADMIN.md — Trợ lý AI hỗ trợ Admin soạn nội dung

**Trạng thái: SPEC — chưa code, cần bạn xác nhận trước khi đưa vào Antigravity.**

## 1. Mục tiêu

Giảm công sức nhập câu hỏi/flashcard thủ công — admin upload 1 file PDF văn bản pháp luật, AI đọc và tự soạn nháp câu hỏi trắc nghiệm + flashcard, admin chỉ cần rà và duyệt thay vì gõ tay từ đầu.

**Nguyên tắc cốt lõi — không thương lượng**: AI KHÔNG BAO GIỜ được tự động xuất bản trực tiếp vào ngân hàng câu hỏi thật (`cau_hoi`) hay flashcard thật (`flashcard`). Mọi nội dung AI sinh ra đều vào bảng NHÁP, admin xem/sửa/duyệt từng câu mới chuyển sang bảng thật.

Lý do: chính dự án này đã phát hiện lỗi số Điều/Khoản sai trong dữ liệu do con người nhập ("Nghị định 167 không có 14 điều") — AI có rủi ro tương tự, thậm chí cao hơn vì AI có thể tạo ra trích dẫn nghe hợp lý nhưng sai hoàn toàn (hiện tượng "hallucination"). Không có ngoại lệ cho quy tắc duyệt tay.

## 2. Luồng nghiệp vụ

```
Admin vào /admin/ai-soan-noi-dung
  → Upload 1 file PDF (văn bản pháp luật, hoặc tài liệu bất kỳ)
  → Chọn loại muốn sinh: Câu hỏi trắc nghiệm / Flashcard / Cả hai
  → Chọn chuyên đề áp dụng (dropdown, giống cách chọn khi import Excel)
  → Nhập số lượng mong muốn (vd 10 câu hỏi, 15 flashcard)
  → Bấm "Sinh nội dung"
     → Server Action gửi PDF (dạng base64/document) trực tiếp cho Gemini API
       kèm system prompt nghiêm ngặt (mục 4)
     → Gemini trả về JSON có cấu trúc cố định
     → Lưu vào bảng NHÁP (mục 3), trạng thái "cho_duyet"
  → Admin vào /admin/ai-soan-noi-dung/duyet: xem từng câu/thẻ nháp
     → Sửa trực tiếp nếu cần (giống form sửa câu hỏi thường)
     → Bấm "Duyệt" → INSERT sang bảng thật (cau_hoi hoặc flashcard)
     → Bấm "Từ chối" → xóa khỏi bảng nháp, không ảnh hưởng gì
```

## 3. Schema đề xuất

```sql
create table cau_hoi_nhap (
  id uuid primary key default gen_random_uuid(),
  chuyen_de_id uuid references danh_muc_chuyen_de(id) not null,
  noi_dung text not null,
  cac_lua_chon jsonb not null,
  dap_an_dung char(1) not null,
  can_cu_phap_ly text not null,
  nguon_file text,              -- tên file PDF gốc, để admin đối chiếu lại
  trang_thai text default 'cho_duyet' check (trang_thai in ('cho_duyet','da_duyet','tu_choi')),
  tao_boi_ai boolean default true,
  created_at timestamptz default now()
);

create table flashcard_nhap (
  id uuid primary key default gen_random_uuid(),
  chuyen_de_id uuid references danh_muc_chuyen_de(id) not null,
  mat_truoc text not null,
  mat_sau text not null,
  nguon_file text,
  trang_thai text default 'cho_duyet' check (trang_thai in ('cho_duyet','da_duyet','tu_choi')),
  created_at timestamptz default now()
);
```

RLS: chỉ admin (select/insert/update/delete), giống pattern `for all` đã dùng cho `cau_hoi`.

## 4. System Prompt đề xuất cho Gemini

```
Bạn là trợ lý soạn thảo nội dung ôn thi nghiệp vụ Hải quan. Bạn nhận 1 file PDF
văn bản pháp luật. Nhiệm vụ: sinh ra [N] câu hỏi trắc nghiệm 4 đáp án (hoặc
flashcard) DỰA HOÀN TOÀN vào nội dung trong file PDF này, không dùng kiến thức
bên ngoài file.

Với mỗi câu hỏi:
- Trích dẫn CHÍNH XÁC số Điều/Khoản/Thông tư từ văn bản — nếu không chắc chắn
  về số Điều/Khoản, KHÔNG tự suy diễn, để trống trường can_cu_phap_ly và đánh
  dấu "can_kiem_tra": true để admin tự tra lại.
- Không tạo câu dạng "tất cả các phương án trên đều đúng".
- Trả về ĐÚNG định dạng JSON sau, không kèm text giải thích nào khác:
  [{ "noi_dung": "...", "lua_chon": {"A":"...","B":"...","C":"...","D":"..."},
     "dap_an_dung": "A", "can_cu_phap_ly": "...", "can_kiem_tra": false }]
```

## 5. Giới hạn & an toàn

- Chỉ admin truy cập được tính năng này (route bảo vệ giống các trang `/admin/*` khác).
- Giới hạn số lần gọi/ngày cho tính năng này (vd 5 lần/ngày) để tránh dùng hết quota Gemini free tier ngoài ý muốn.
- File PDF upload tạm thời (không cần lưu lâu dài — chỉ cần lưu tên file vào `nguon_file` để admin nhớ nguồn, file gốc có thể giữ ở R2 nếu muốn tra lại sau).
- Câu có `can_kiem_tra = true` cần hiện nổi bật (màu cảnh báo) ở màn hình duyệt, nhắc admin tra lại kỹ trước khi duyệt.

## 6. Việc cần xác nhận trước khi code

1. Số lượng câu hỏi/flashcard tối đa sinh 1 lần (đề xuất 10-15, tránh phản hồi quá dài/chậm).
2. Giới hạn số lần dùng/ngày cho tính năng này (đề xuất 5 lần/ngày).
3. Có cần lưu lại file PDF gốc trên R2 để admin tải lại đối chiếu sau này không, hay chỉ cần lưu tên file?
