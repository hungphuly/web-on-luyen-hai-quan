-- Thêm policy cho phép admin INSERT/UPDATE/DELETE trên bảng bai_giang_ly_thuyet
create policy "chi_admin_ghi_ly_thuyet" on bai_giang_ly_thuyet for all
  using (exists (select 1 from hoc_vien where id = auth.uid() and loai_tai_khoan = 'admin'))
  with check (exists (select 1 from hoc_vien where id = auth.uid() and loai_tai_khoan = 'admin'));

-- Thêm policy cho phép admin INSERT/UPDATE/DELETE trên bảng bai_giang_video
create policy "chi_admin_ghi_video" on bai_giang_video for all
  using (exists (select 1 from hoc_vien where id = auth.uid() and loai_tai_khoan = 'admin'))
  with check (exists (select 1 from hoc_vien where id = auth.uid() and loai_tai_khoan = 'admin'));
