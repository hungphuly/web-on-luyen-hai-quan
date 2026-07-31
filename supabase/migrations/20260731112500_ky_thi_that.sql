-- 1. Cập nhật bảng cau_hoi
DROP VIEW IF EXISTS public.cau_hoi_public;

ALTER TABLE public.cau_hoi DROP CONSTRAINT IF EXISTS cau_hoi_phan_loai_check;
ALTER TABLE public.cau_hoi ALTER COLUMN phan_loai TYPE integer[] USING ARRAY[phan_loai];
ALTER TABLE public.cau_hoi ALTER COLUMN phan_loai SET DEFAULT '{1}';

CREATE VIEW public.cau_hoi_public AS
  SELECT 
    id, 
    chuyen_de_id, 
    noi_dung, 
    cac_lua_chon,
    do_kho,
    phan_loai
  FROM public.cau_hoi;

-- 2. Tạo bảng ky_thi
CREATE TABLE public.ky_thi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ten_ky_thi text NOT NULL,
  mo_ta text,
  thoi_gian_lam_bai integer NOT NULL, -- tính bằng phút
  cau_hinh_chuyen_de uuid[], -- null hoặc array rỗng nghĩa là chọn tất cả
  so_luong_cau_hoi integer NOT NULL,
  doi_tuong_thi jsonb DEFAULT '{"type": "all"}'::jsonb,
  trang_thai text DEFAULT 'draft' CHECK (trang_thai IN ('draft', 'active', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ky_thi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép tất cả xem kỳ thi active" ON public.ky_thi FOR SELECT USING (trang_thai = 'active' OR (EXISTS (SELECT 1 FROM public.hoc_vien WHERE id = auth.uid() AND loai_tai_khoan = 'admin')));
CREATE POLICY "Admin full quyền ky_thi" ON public.ky_thi FOR ALL USING (EXISTS (SELECT 1 FROM public.hoc_vien WHERE id = auth.uid() AND loai_tai_khoan = 'admin'));

-- 3. Tạo bảng ky_thi_phien_lam_bai
CREATE TABLE public.ky_thi_phien_lam_bai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ky_thi_id uuid REFERENCES public.ky_thi(id) ON DELETE CASCADE NOT NULL,
  hoc_vien_id uuid REFERENCES public.hoc_vien(id) ON DELETE CASCADE NOT NULL,
  bat_dau_luc timestamptz DEFAULT now(),
  ket_thuc_luc timestamptz,
  trang_thai text DEFAULT 'dang_thi' CHECK (trang_thai IN ('dang_thi', 'da_nop')),
  danh_sach_cau_hoi jsonb NOT NULL,
  bai_lam_tam_thoi jsonb DEFAULT '{}'::jsonb,
  ket_qua jsonb,
  diem_so numeric,
  UNIQUE(ky_thi_id, hoc_vien_id)
);
ALTER TABLE public.ky_thi_phien_lam_bai ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Học viên tự xem phiên thi của mình" ON public.ky_thi_phien_lam_bai FOR SELECT USING (hoc_vien_id = auth.uid());
CREATE POLICY "Học viên tạo phiên thi của mình" ON public.ky_thi_phien_lam_bai FOR INSERT WITH CHECK (hoc_vien_id = auth.uid());
CREATE POLICY "Học viên cập nhật phiên thi của mình" ON public.ky_thi_phien_lam_bai FOR UPDATE USING (hoc_vien_id = auth.uid()) WITH CHECK (hoc_vien_id = auth.uid());
CREATE POLICY "Admin xem tất cả phiên thi" ON public.ky_thi_phien_lam_bai FOR SELECT USING (EXISTS (SELECT 1 FROM public.hoc_vien WHERE id = auth.uid() AND loai_tai_khoan = 'admin'));

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ky_thi_updated_at ON public.ky_thi;
CREATE TRIGGER update_ky_thi_updated_at BEFORE UPDATE ON public.ky_thi FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
