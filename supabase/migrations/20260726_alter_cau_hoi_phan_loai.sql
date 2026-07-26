-- Bổ sung Độ khó (số) và Phân loại câu hỏi

-- 1. Xoá check constraint cũ của do_kho
ALTER TABLE public.cau_hoi DROP CONSTRAINT IF EXISTS cau_hoi_do_kho_check;

-- 2. Đổi kiểu dữ liệu do_kho từ text sang integer
--    Map dữ liệu cũ: 'de' -> 1, 'trung_binh' -> 2, 'kho' -> 3. Nếu null hoặc rác thì mặc định 2.
ALTER TABLE public.cau_hoi 
  ALTER COLUMN do_kho TYPE integer 
  USING (
    CASE 
      WHEN do_kho = 'de' THEN 1
      WHEN do_kho = 'trung_binh' THEN 2
      WHEN do_kho = 'kho' THEN 3
      ELSE 2
    END
  );

-- 3. Thêm check constraint mới cho do_kho
ALTER TABLE public.cau_hoi ADD CONSTRAINT cau_hoi_do_kho_check CHECK (do_kho IN (1, 2, 3));

-- 4. Thêm cột phan_loai (1=Ôn luyện, 2=Thi thử, 3=Thi thật)
ALTER TABLE public.cau_hoi ADD COLUMN phan_loai integer DEFAULT 1 CHECK (phan_loai IN (1, 2, 3));

-- 5. Cập nhật View public
DROP VIEW IF EXISTS public.cau_hoi_public;
CREATE VIEW public.cau_hoi_public AS
  SELECT 
    id, 
    chuyen_de_id, 
    noi_dung, 
    cac_lua_chon,
    do_kho,
    phan_loai
  FROM public.cau_hoi;
