-- Thêm cột chuyen_de_id vào bảng ket_qua_thi
ALTER TABLE public.ket_qua_thi
ADD COLUMN chuyen_de_id uuid REFERENCES public.danh_muc_chuyen_de(id);

-- Optional: tạo index để query lịch sử nhanh hơn
CREATE INDEX IF NOT EXISTS idx_ket_qua_thi_chuyen_de_id ON public.ket_qua_thi(chuyen_de_id);
