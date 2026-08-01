import { createClient } from '@/lib/shared/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, FileText, CheckCircle, CalendarRange } from 'lucide-react';
import { KyThi } from '@/lib/modules/ky-thi/types';

export const metadata = {
  title: 'Kỳ thi thật',
};

export default async function KyThiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get active exams
  const { data: exams, error } = await supabase
    .from('ky_thi')
    .select('*')
    .eq('trang_thai', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching exams:', error);
  }

  // Get user's sessions to see if they are taking or have submitted
  const { data: sessions } = await supabase
    .from('ky_thi_phien_lam_bai')
    .select('ky_thi_id, trang_thai, diem_so')
    .eq('hoc_vien_id', user.id);

  const sessionMap = new Map(sessions?.map(s => [s.ky_thi_id, s]));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Kỳ thi thật</h1>
        <p className="text-gray-500">Danh sách các kỳ thi đang mở. Lưu ý: Mỗi kỳ thi bạn chỉ được làm bài 1 lần duy nhất.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(!exams || exams.length === 0) ? (
          <div className="col-span-full p-8 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Hiện tại không có kỳ thi nào đang mở.</p>
          </div>
        ) : (
          exams.map((exam: KyThi) => {
            const session = sessionMap.get(exam.id);
            const isCompleted = session?.trang_thai === 'da_nop';
            const isInProgress = session?.trang_thai === 'dang_thi';

            return (
              <div key={exam.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col hover:border-primary/50 transition-colors">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{exam.ten_ky_thi}</h3>
                    {isCompleted && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Đã hoàn thành
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-pulse" /> Đang làm bài
                      </span>
                    )}
                  </div>
                  
                  {exam.mo_ta && <p className="text-sm text-gray-600 mb-4">{exam.mo_ta}</p>}
                  
                  <div className="flex flex-col gap-2 text-sm text-gray-600 mb-6">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{exam.thoi_gian_lam_bai} phút</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{exam.so_luong_cau_hoi} câu hỏi</span>
                      </div>
                    </div>
                    
                    {(exam.thoi_gian_bat_dau || exam.thoi_gian_ket_thuc) && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded-md border">
                        <CalendarRange className="w-4 h-4 shrink-0 text-gray-400" />
                        <span>
                          {exam.thoi_gian_bat_dau ? new Date(exam.thoi_gian_bat_dau).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Không giới hạn'} 
                          {' đến '} 
                          {exam.thoi_gian_ket_thuc ? new Date(exam.thoi_gian_ket_thuc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Không giới hạn'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isCompleted ? (
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-500">Điểm của bạn:</span>
                    <span className="text-lg font-bold text-primary">{session.diem_so} / 10</span>
                  </div>
                ) : (
                  <Link href={`/ky-thi/${exam.id}`}>
                    <Button className="w-full" variant={isInProgress ? "default" : "outline"}>
                      {isInProgress ? 'Tiếp tục làm bài' : 'Bắt đầu thi'}
                    </Button>
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
