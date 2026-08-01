import { createClient } from '@/lib/shared/utils/supabase/server';
import { redirect } from 'next/navigation';
import { KetQuaClient } from './KetQuaClient';

export const metadata = {
  title: 'Kết quả Kỳ thi',
};

export default async function AdminKetQuaKyThiPage({ params }: { params: { id: string } }) {
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

  // Get ky_thi details
  const { data: kyThi } = await supabase.from('ky_thi').select('*').eq('id', params.id).single();
  
  if (!kyThi) return <div>Không tìm thấy kỳ thi</div>;

  // Get results
  const { data: sessions } = await supabase
    .from('ky_thi_phien_lam_bai')
    .select(`
      *,
      hoc_vien:hoc_vien_id (
        ho_ten,
        email,
        so_dien_thoai
      )
    `)
    .eq('ky_thi_id', params.id)
    .order('diem_so', { ascending: false, nullsFirst: false });

  return <KetQuaClient kyThi={kyThi} sessions={sessions || []} />;
}
