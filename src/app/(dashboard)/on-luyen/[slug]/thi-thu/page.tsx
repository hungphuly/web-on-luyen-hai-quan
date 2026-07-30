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
  
  // Kiểm tra giới hạn thi thử (2 lần/ngày) cho tài khoản Free
  let limitExceeded = false;
  let limitInfo = { remaining: 2, limit: 2, unlimited: true };
  
  const { data: hocVien } = await supabase
    .from('hoc_vien')
    .select('loai_tai_khoan')
    .eq('id', user.id)
    .single();

  if (hocVien?.loai_tai_khoan === 'free') {
    limitInfo.unlimited = false;
    
    // Lấy thời điểm bắt đầu ngày hôm nay theo giờ Việt Nam (UTC+7)
    const now = new Date();
    const nowUtc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(nowUtc + 7 * 3600000);
    const startOfDayVNInUTC = new Date(Date.UTC(vnTime.getFullYear(), vnTime.getMonth(), vnTime.getDate(), -7, 0, 0, 0));
    
    const { count } = await supabase
      .from('ket_qua_thi')
      .select('*', { count: 'exact', head: true })
      .eq('hoc_vien_id', user.id)
      .eq('loai_bai', 'thi_thu')
      .gte('ngay_thi', startOfDayVNInUTC.toISOString());
      
    const used = count || 0;
    limitInfo.remaining = Math.max(0, 2 - used);
    
    if (limitInfo.remaining <= 0) {
      limitExceeded = true;
    }
  }
  
  if (!chuyenDe) {
    notFound();
  }

  // --- GATE LOGIC: Kiểm tra hoàn thành tiến độ học liệu ---
  // 1. Lấy danh sách video và lý thuyết
  const { data: videos } = await supabase.from('bai_giang_video').select('id').eq('chuyen_de_id', chuyenDe.id);
  const { data: lyThuyets } = await supabase.from('bai_giang_ly_thuyet').select('id').eq('chuyen_de_id', chuyenDe.id);
  
  // 2. Lấy tiến độ của học viên
  const { data: tienDoVideo } = await supabase.from('video_tien_do').select('bai_giang_video_id, da_hoan_thanh').eq('hoc_vien_id', user.id);
  const { data: tienDoLyThuyet } = await supabase.from('tien_do_hoc_lieu').select('bai_ly_thuyet_id, da_hoan_thanh').eq('hoc_vien_id', user.id);
  
  // 3. Kiểm tra xem tất cả các mục đã hoàn thành chưa
  const hasUnfinishedVideo = (videos || []).some(v => !tienDoVideo?.find(td => td.bai_giang_video_id === v.id)?.da_hoan_thanh);
  const hasUnfinishedLyThuyet = (lyThuyets || []).some(l => !tienDoLyThuyet?.find(td => td.bai_ly_thuyet_id === l.id)?.da_hoan_thanh);

  if (hasUnfinishedVideo || hasUnfinishedLyThuyet) {
    return (
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="bg-white rounded-xl border p-6 md:p-10 text-center space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Chưa đủ điều kiện</h1>
          <p className="text-gray-700 text-lg">Bạn phải hoàn thành toàn bộ bài giảng (video và lý thuyết) của chuyên đề này trước khi thi thử.</p>
          <div className="pt-4">
            <a href={`/bai-giang/${chuyenDe.slug}`} className="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
              Quay lại học bài giảng
            </a>
          </div>
        </div>
      </div>
    );
  }
  // --- END GATE LOGIC ---

  if (limitExceeded) {
    return (
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="bg-white rounded-xl border p-6 md:p-10 text-center space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold text-red-600">Hết lượt thi thử</h1>
          <p className="text-gray-700 text-lg">Bạn đã dùng hết lượt thi thử hôm nay (2/2). Quay lại vào ngày mai.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <ThiThuClientWrapper 
        chuyenDeId={chuyenDe.id} 
        chuyenDeTen={chuyenDe.ten}
        chuyenDeSlug={chuyenDe.slug}
        limitInfo={limitInfo}
      />
    </div>
  );
}
