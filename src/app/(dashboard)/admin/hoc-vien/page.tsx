import { createClient } from '@/lib/shared/utils/supabase/server';
import { redirect } from 'next/navigation';
import { HocVienClient } from './HocVienClient';

export const metadata = {
  title: 'Quản lý Học viên',
};

export const dynamic = 'force-dynamic';

export default async function AdminHocVienPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: hocVien } = await supabase
    .from('hoc_vien')
    .select('loai_tai_khoan')
    .eq('id', user.id)
    .single();

  if (hocVien?.loai_tai_khoan !== 'admin') {
    redirect('/');
  }

  return <HocVienClient />;
}
