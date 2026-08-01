ALTER TABLE public.ky_thi ADD COLUMN IF NOT EXISTS phan_loai_cau_hoi integer[] DEFAULT '{3}';
ALTER TABLE public.ky_thi ADD COLUMN IF NOT EXISTS thoi_gian_bat_dau timestamptz;
ALTER TABLE public.ky_thi ADD COLUMN IF NOT EXISTS thoi_gian_ket_thuc timestamptz;
