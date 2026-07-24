-- Bảng nội dung giới thiệu
CREATE TABLE public.noi_dung_gioi_thieu (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tieu_de text NOT NULL,
    noi_dung_markdown text NOT NULL,
    cap_nhat_luc timestamptz DEFAULT now()
);

ALTER TABLE public.noi_dung_gioi_thieu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tất cả có thể xem nội dung giới thiệu"
ON public.noi_dung_gioi_thieu FOR SELECT
USING (true);

CREATE POLICY "Chỉ admin được sửa nội dung giới thiệu"
ON public.noi_dung_gioi_thieu FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.hoc_vien
    WHERE id = auth.uid() AND loai_tai_khoan = 'admin'
  )
);
