-- Bổ sung cột phien_id vào bảng lich_su_on_luyen
ALTER TABLE public.lich_su_on_luyen 
ADD COLUMN phien_id uuid;

-- Tuy là uuid nhưng hiện tại chưa cần tạo bảng phien_on_luyen riêng vì chỉ cần gom nhóm phía client
-- Để đảm bảo hiệu suất truy vấn, có thể thêm index
CREATE INDEX IF NOT EXISTS idx_lich_su_on_luyen_phien_id ON public.lich_su_on_luyen(phien_id);
