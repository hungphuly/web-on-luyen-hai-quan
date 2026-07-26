import Link from 'next/link';
import { getDanhSachChuyenDeCoCauHoi } from '@/lib/modules/on-luyen/services/on-luyen.service';
import { BookOpen, Target, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/shared/utils/supabase/server';

export const metadata = {
  title: 'Thi thử - Ôn Luyện Hải Quan',
};

export default async function ThiThuListPage() {
  const chuyenDeList = await getDanhSachChuyenDeCoCauHoi();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let limitInfo = { remaining: 2, limit: 2, unlimited: true };
  if (user) {
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
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">Thi thử</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-4">Lựa chọn chuyên đề để bắt đầu bài thi thử tính giờ.</p>
        
        {!limitInfo.unlimited && (
          <div className={`p-4 rounded-lg border ${limitInfo.remaining > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-red-50 border-red-200 text-red-800'} mb-8 flex items-center gap-2`}>
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-medium">
              {limitInfo.remaining > 0 
                ? `Tài khoản miễn phí: Bạn còn ${limitInfo.remaining}/${limitInfo.limit} lượt thi thử trong ngày hôm nay.` 
                : `Tài khoản miễn phí: Bạn đã hết lượt thi thử hôm nay. Vui lòng quay lại vào ngày mai.`}
            </span>
          </div>
        )}
      </div>

      {chuyenDeList.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-muted-foreground">
          Chưa có chuyên đề nào có đủ câu hỏi.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chuyenDeList.map((cd) => (
            <Link key={cd.id} href={`/on-luyen/${cd.slug}/thi-thu`} className="group">
              <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden h-full flex flex-col transition-all hover:shadow-md hover:border-rose-400 relative">
                {cd.cau_hoi_count > 0 && (
                  <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                    Sẵn sàng
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="bg-rose-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-rose-600 group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">{cd.ten}</h3>
                  {cd.mo_ta && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{cd.mo_ta}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-600 mt-auto pt-4 border-t">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-rose-500" />
                      <span>{cd.cau_hoi_count} Câu hỏi</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
