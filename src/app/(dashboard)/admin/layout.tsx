import { createClient } from '@/lib/shared/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Kiểm tra quyền admin
  const { data: hocVien } = await supabase
    .from('hoc_vien')
    .select('loai_tai_khoan')
    .eq('id', user.id)
    .single();

  if (hocVien?.loai_tai_khoan !== 'admin') {
    // Không có quyền, đẩy về trang chủ / profile
    redirect('/profile');
  }

  return (
    <div className="admin-layout-container">
      {children}
    </div>
  );
}
