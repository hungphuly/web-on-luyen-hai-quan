import { createClient } from '@/lib/shared/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, CreditCard, Flame, Map } from 'lucide-react'
import { getDanhSachChuyenDeFlashcard } from '@/lib/modules/flashcard/services/flashcard.service'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Nếu chưa đăng nhập -> Landing Page
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-8">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
          <Map className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          ÔN LUYỆN THI CHỨNG CHỈ <br className="hidden md:block"/>
          <span className="text-primary">NGHIỆP VỤ HẢI QUAN</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Nền tảng học tập, thi thử, tra cứu pháp luật thông minh giúp bạn tự tin đỗ chứng chỉ nghiệp vụ khai hải quan.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg">Bắt đầu học ngay</Button>
          </Link>
          <Link href="/gioi-thieu">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg">Tìm hiểu thêm</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 2. Nếu đã đăng nhập -> Dashboard Cá Nhân
  
  // Tính tổng số flashcard đến hạn
  const flashcardChuyenDe = await getDanhSachChuyenDeFlashcard();
  const totalDueCards = flashcardChuyenDe.reduce((acc, cd) => acc + (cd.due_count || 0), 0);

  // Lấy tổng quan ôn luyện hôm nay (nếu có, query bảng lich_su_on_luyen)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: cauHoiHomNay } = await supabase
    .from('lich_su_on_luyen')
    .select('*', { count: 'exact', head: true })
    .eq('hoc_vien_id', user.id)
    .gte('ngay_lam', today.toISOString());

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Chào mừng trở lại!</h1>
        <p className="text-muted-foreground mt-2">Hôm nay bạn muốn học gì?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-6 shadow-sm flex flex-col items-start gap-4 hover:border-primary/50 transition-colors">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Tiến độ hôm nay</h3>
            <p className="text-muted-foreground">Bạn đã làm <span className="font-bold text-gray-900">{cauHoiHomNay || 0}</span> câu hỏi trắc nghiệm trong ngày hôm nay.</p>
          </div>
          <Link href="/on-luyen" className="mt-auto pt-4 w-full">
            <Button className="w-full" variant="outline">Tiếp tục ôn luyện</Button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border p-6 shadow-sm flex flex-col items-start gap-4 hover:border-primary/50 transition-colors">
          <div className="p-3 bg-red-100 text-red-700 rounded-xl relative">
            <CreditCard className="w-6 h-6" />
            {totalDueCards > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg">Flashcards</h3>
            <p className="text-muted-foreground">
              {totalDueCards > 0 
                ? `Bạn có ${totalDueCards} thẻ ghi nhớ cần ôn tập lại ngay.`
                : `Tuyệt vời! Bạn đã hoàn thành các thẻ trong hôm nay.`}
            </p>
          </div>
          <Link href="/flashcards" className="mt-auto pt-4 w-full">
            <Button className="w-full" variant={totalDueCards > 0 ? 'default' : 'outline'}>
              {totalDueCards > 0 ? 'Ôn tập ngay' : 'Xem danh sách thẻ'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
