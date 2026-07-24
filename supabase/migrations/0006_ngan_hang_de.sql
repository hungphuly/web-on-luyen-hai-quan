-- 1. Xóa view cũ (vì nó phụ thuộc vào cột chuyen_de)
drop view if exists public.cau_hoi_public;

-- 2. Cập nhật bảng cau_hoi
alter table public.cau_hoi add column chuyen_de_id uuid references public.danh_muc_chuyen_de(id);

-- Ánh xạ dữ liệu cũ nếu có
update public.cau_hoi q 
set chuyen_de_id = c.id 
from public.danh_muc_chuyen_de c 
where q.chuyen_de = c.ten;

-- Trong trường hợp câu hỏi cũ chưa có chuyên đề khớp, ta sẽ không ép not null ngay nếu dữ liệu bị lỗi, 
-- nhưng theo nguyên tắc thì phải xóa cột cũ và đặt not null.
-- Lưu ý: Vì đây là môi trường mới nên ta an toàn drop.
alter table public.cau_hoi drop column chuyen_de;
alter table public.cau_hoi alter column chuyen_de_id set not null;

-- Bổ sung các cột mới theo yêu cầu Phase 4
alter table public.cau_hoi add column can_cu_phap_ly text not null default 'Chưa cập nhật';
alter table public.cau_hoi alter column can_cu_phap_ly drop default;
alter table public.cau_hoi add column do_kho text check (do_kho in ('de','trung_binh','kho'));

-- 3. Tạo lại view cau_hoi_public tuyệt đối không chứa đáp án
create view public.cau_hoi_public as
  select 
    id, 
    chuyen_de_id, 
    noi_dung, 
    cac_lua_chon 
  from public.cau_hoi;

-- 4. RLS: Chỉ Admin được phép thao tác trên bảng cau_hoi
-- (Vì RLS đã bật từ Phase 1, ta chỉ cần thêm Policy)
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
