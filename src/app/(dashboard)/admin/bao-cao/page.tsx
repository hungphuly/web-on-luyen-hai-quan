import { createClient } from '@/lib/shared/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getTongQuanStats, getChuyenDeStats, getKyThiStats } from '@/lib/modules/admin/actions/bao-cao.actions';
import { BaoCaoDashboardClient } from './BaoCaoDashboardClient';

export const metadata = {
  title: 'Báo cáo & Thống kê',
};

export const dynamic = 'force-dynamic';

export default async function AdminBaoCaoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('hoc_vien')
    .select('loai_tai_khoan')
    .eq('id', user.id)
    .single();

  if (profile?.loai_tai_khoan !== 'admin') {
    redirect('/');
  }

  // Fetch all stats concurrently
  const [tongQuan, chuyenDeStats, kyThiStats] = await Promise.all([
    getTongQuanStats(),
    getChuyenDeStats(),
    getKyThiStats()
  ]);

  return (
    <div className="pb-24">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
        <p className="text-gray-500 text-sm">Toàn cảnh dữ liệu học tập và thi cử của học viên trên hệ thống.</p>
      </div>

      <BaoCaoDashboardClient 
        tongQuan={tongQuan}
        chuyenDeStats={chuyenDeStats}
        kyThiStats={kyThiStats}
      />
    </div>
  );
}
