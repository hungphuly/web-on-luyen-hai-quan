import { getDanhSachChuyenDeCoCauHoi } from '@/lib/modules/on-luyen/services/on-luyen.service';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/shared/utils/supabase/server';
import { ThiThuClientWrapper } from './ThiThuClientWrapper';

export const metadata = {
  title: 'Thi thử - Ôn Luyện Hải Quan',
};

export default async function ThiThuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/on-luyen/' + slug + '/thi-thu');
  }

  // Lấy thông tin chuyên đề
  const { data: chuyenDeList } = await supabase
    .from('danh_muc_chuyen_de')
    .select('id, ten, slug, mo_ta')
    .eq('slug', slug);

  const chuyenDe = chuyenDeList?.[0];
  
  if (!chuyenDe) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <ThiThuClientWrapper 
        chuyenDeId={chuyenDe.id} 
        chuyenDeTen={chuyenDe.ten} 
      />
    </div>
  );
}
