-- Migration: Hỗ trợ câu hỏi nhiều đáp án đúng (Multi-select) và bổ sung la_nhieu_dap_an vào cau_hoi_public

-- 1. Đảm bảo kiểu dữ liệu dap_an_dung trong bảng cau_hoi là text
ALTER TABLE public.cau_hoi ALTER COLUMN dap_an_dung TYPE text;

-- 2. Cập nhật View cau_hoi_public để thêm cờ la_nhieu_dap_an
DROP VIEW IF EXISTS public.cau_hoi_public;

CREATE VIEW public.cau_hoi_public AS
  SELECT 
    id, 
    chuyen_de_id, 
    noi_dung, 
    cac_lua_chon,
    do_kho,
    phan_loai,
    (POSITION(',' IN dap_an_dung) > 0) AS la_nhieu_dap_an
  FROM public.cau_hoi;

-- 3. Cấp quyền truy cập cho PostgREST API
GRANT SELECT ON public.cau_hoi_public TO anon, authenticated, service_role;
