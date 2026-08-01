import { createClient } from '@/lib/shared/utils/supabase/server';
import { redirect } from 'next/navigation';
import { KyThiClient } from './KyThiClient';
import { getDanhSachChuyenDe } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { getKyThiAdmin } from '@/lib/modules/admin/actions/ky-thi.actions';

export const metadata = {
  title: 'Quản lý Kỳ thi thật',
};

export default async function AdminKyThiPage() {
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

  const kyThiList = await getKyThiAdmin();
  const chuyenDeList = await getDanhSachChuyenDe();

  return <KyThiClient initialData={kyThiList} chuyenDeList={chuyenDeList} />;
}
