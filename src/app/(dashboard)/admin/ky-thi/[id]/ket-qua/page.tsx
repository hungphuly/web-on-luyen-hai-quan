import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server';
import { redirect } from 'next/navigation';
import { KetQuaClient } from './KetQuaClient';

export const metadata = {
  title: 'Kết quả Kỳ thi',
};

export const dynamic = 'force-dynamic';

export default async function AdminKetQuaKyThiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const { data: kyThi } = await supabase.from('ky_thi').select('*').eq('id', id).single();
  
  if (!kyThi) return <div>Không tìm thấy kỳ thi</div>;

  // Get results using admin client to bypass RLS on hoc_vien table
  const adminSupabase = await createAdminClient();
  const { data: sessions, error: sessionsError } = await adminSupabase
    .from('ky_thi_phien_lam_bai')
    .select(`
      *,
      hoc_vien (
        ho_ten,
        email,
        so_dien_thoai
      )
    `)
    .eq('ky_thi_id', id)
    .order('diem_so', { ascending: false, nullsFirst: false });

  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError);
  }

  return <KetQuaClient kyThi={kyThi} sessions={sessions || []} />;
}
