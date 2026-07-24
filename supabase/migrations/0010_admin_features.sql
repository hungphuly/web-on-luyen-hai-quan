-- Bảng văn bản pháp luật
CREATE TABLE public.van_ban_phap_luat (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_van_ban text NOT NULL,
    so_hieu text,
    ngay_ban_hanh date,
    ngay_het_hieu_luc date,
    trang_thai text DEFAULT 'Hết hiệu lực',
    file_url text, -- URL của file PDF
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Bật RLS
ALTER TABLE public.van_ban_phap_luat ENABLE ROW LEVEL SECURITY;

-- Select công khai
CREATE POLICY "Cho phép tất cả mọi người xem văn bản"
ON public.van_ban_phap_luat FOR SELECT
USING (true);

-- Chỉ admin được chỉnh sửa
CREATE POLICY "Chỉ admin được chỉnh sửa văn bản"
ON public.van_ban_phap_luat FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.hoc_vien
    WHERE id = auth.uid() AND loai_tai_khoan = 'admin'
  )
);

-- Tạo Storage Bucket cho tài liệu nếu chưa có (lưu ý: cần quyền superuser hoặc quản trị qua UI, 
-- ở đây viết script mô phỏng, thực tế bạn tạo trong Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tai_lieu_phap_luat', 'tai_lieu_phap_luat', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'tai_lieu_phap_luat');
-- CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tai_lieu_phap_luat' AND EXISTS (SELECT 1 FROM public.hoc_vien WHERE id = auth.uid() AND loai_tai_khoan = 'admin'));
