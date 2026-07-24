-- Thay đổi giá trị mặc định của cột trang_thai thành 'Còn hiệu lực'
ALTER TABLE public.van_ban_phap_luat 
ALTER COLUMN trang_thai SET DEFAULT 'Còn hiệu lực';
