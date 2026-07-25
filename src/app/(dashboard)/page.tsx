import { createClient } from '@/lib/shared/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, CreditCard, Flame, Map, Play, CheckCircle2, GraduationCap, TrendingUp, ChevronRight, Award } from 'lucide-react'
import { getDanhSachChuyenDeFlashcard } from '@/lib/modules/flashcard/services/flashcard.service'
import { getPublicStats } from '@/lib/modules/trang-chu/services/trang-chu.service'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Lấy dữ liệu thống kê công khai
  const publicStats = await getPublicStats()

  // Các biến dữ liệu cá nhân
  let totalDueCards = 0
  let lyThuyetDaHoc = 0
  let ketQuaThiThu: any = null

  if (user) {
    // 1. Flashcard
    const flashcardChuyenDe = await getDanhSachChuyenDeFlashcard();
    totalDueCards = flashcardChuyenDe.reduce((acc, cd) => acc + (cd.due_count || 0), 0);

    // 2. Bài giảng lý thuyết đã hoàn thành
    const { count: completedLyThuyet } = await supabase
      .from('tien_do_hoc_tap')
      .select('*', { count: 'exact', head: true })
      .eq('hoc_vien_id', user.id)
    lyThuyetDaHoc = completedLyThuyet || 0

    // 3. Kết quả thi thử gần nhất
    const { data: kqThiThu } = await supabase
      .from('ket_qua_thi')
      .select('*, chuyen_de:danh_muc_chuyen_de(ten)')
      .eq('hoc_vien_id', user.id)
      .eq('loai_bai', 'thi_thu')
      .order('ngay_thi', { ascending: false })
      .limit(1)
      .single()
    
    ketQuaThiThu = kqThiThu
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* 1. Banner Chào mừng (Gradient) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#103025] text-white p-8 md:p-12 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              {user ? 'Chào mừng bạn trở lại!' : 'Ôn luyện thi Chứng chỉ Nghiệp vụ Hải quan'}
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-xl">
              Nền tảng học tập thông minh giúp bạn tự tin đỗ chứng chỉ với hệ thống câu hỏi, bài giảng và thẻ ghi nhớ hiện đại.
            </p>
          </div>
          
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <Award className="w-16 h-16 text-accent animate-pulse-slow" />
          </div>
        </div>
      </div>

      {/* 2. Khối thống kê CÔNG KHAI */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">Khám phá kho học liệu</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{publicStats.tongBaiGiang}</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Bài giảng</p>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{publicStats.videoCount}</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Video</p>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{publicStats.cauHoiCount}</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Câu trắc nghiệm</p>
            </div>
          </div>
          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{publicStats.flashcardCount}</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Thẻ ghi nhớ</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Phần dành cho User / Guest */}
      {!user ? (
        <div className="bg-white rounded-3xl border shadow-sm p-10 text-center space-y-6 mt-8">
          <GraduationCap className="w-16 h-16 text-primary mx-auto opacity-80" />
          <h2 className="text-2xl font-bold text-gray-900">Sẵn sàng để bắt đầu hành trình?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Tạo tài khoản ngay hôm nay để trải nghiệm đầy đủ các tính năng: lưu tiến độ học tập, chấm điểm tự động và thuật toán Spaced Repetition cho Flashcards.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto px-8 h-12 text-base font-semibold">Đăng ký miễn phí</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 text-base font-semibold">Đăng nhập</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Tiến độ cá nhân
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Flashcard Due */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm flex flex-col items-start gap-4 hover:border-primary/50 transition-colors">
              <div className="w-full flex justify-between items-start">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl relative">
                  <Flame className="w-6 h-6" />
                  {totalDueCards > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <h3 className="font-bold text-lg text-gray-900">Ôn tập Flashcards</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {totalDueCards > 0 
                    ? <span>Bạn có <strong className="text-red-600">{totalDueCards}</strong> thẻ cần ôn tập hôm nay.</span>
                    : `Tuyệt vời! Bạn đã học hết bài của hôm nay.`}
                </p>
              </div>
              <Link href="/flashcards" className="mt-auto pt-4 w-full">
                <Button className="w-full justify-between" variant={totalDueCards > 0 ? 'default' : 'outline'}>
                  {totalDueCards > 0 ? 'Học ngay' : 'Xem danh sách thẻ'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Lý thuyết đã học */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm flex flex-col items-start gap-4 hover:border-primary/50 transition-colors">
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="mt-2 w-full">
                <h3 className="font-bold text-lg text-gray-900">Tiến độ bài giảng</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-gray-900">{lyThuyetDaHoc}</span>
                  <span className="text-muted-foreground text-sm">/ {publicStats.lyThuyetCount} lý thuyết</span>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, publicStats.lyThuyetCount > 0 ? (lyThuyetDaHoc / publicStats.lyThuyetCount) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>
              <Link href="/bai-giang" className="mt-auto pt-4 w-full">
                <Button className="w-full justify-between" variant="outline">
                  Tiếp tục học
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Thi thử gần nhất */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm flex flex-col items-start gap-4 hover:border-primary/50 transition-colors">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="mt-2 w-full">
                <h3 className="font-bold text-lg text-gray-900">Thi thử gần nhất</h3>
                {ketQuaThiThu ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-3xl font-black text-gray-900">
                      {ketQuaThiThu.diem_so} <span className="text-base font-normal text-muted-foreground">điểm</span>
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 truncate" title={ketQuaThiThu.chuyen_de?.ten || ''}>
                      {ketQuaThiThu.chuyen_de?.ten || 'Bài thi tổng hợp'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(ketQuaThiThu.ngay_thi), 'dd MMMM yyyy', { locale: vi })}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1 text-sm">Bạn chưa làm bài thi thử nào.</p>
                )}
              </div>
              <Link href="/on-luyen" className="mt-auto pt-4 w-full">
                <Button className="w-full justify-between" variant={ketQuaThiThu ? "outline" : "default"}>
                  Thi thử ngay
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
