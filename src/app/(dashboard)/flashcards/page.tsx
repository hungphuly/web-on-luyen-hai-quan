import Link from 'next/link';
import { getDanhSachChuyenDeFlashcard } from '@/lib/modules/flashcard/services/flashcard.service';
import { CreditCard, Flame, Layers } from 'lucide-react';

export const metadata = {
  title: 'Flashcards - Ôn Luyện Hải Quan',
};

export default async function FlashcardsPage() {
  const chuyenDeList = await getDanhSachChuyenDeFlashcard();

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">Flashcards Ghi Nhớ</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-8">Học nhanh các mã HS, thuật ngữ chuyên ngành bằng phương pháp lặp lại ngắt quãng (Leitner).</p>
      </div>

      {chuyenDeList.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-muted-foreground">
          Chưa có chuyên đề Flashcard nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chuyenDeList.map((cd) => (
            <Link key={cd.id} href={`/flashcards/${cd.slug}`} className="group">
              <div className="bg-white rounded-xl border border-primary/20 shadow-sm overflow-hidden h-full flex flex-col transition-all hover:shadow-md hover:border-primary/40 relative">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-sidebar-active-bg w-12 h-12 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Layers className="w-6 h-6" />
                    </div>
                    {cd.due_count > 0 && (
                      <div className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                        <Flame className="w-3.5 h-3.5" />
                        {cd.due_count} thẻ đến hạn
                      </div>
                    )}
                    {cd.due_count === 0 && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        Hoàn thành
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-primary mb-2">{cd.ten}</h3>
                  {cd.mo_ta && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{cd.mo_ta}</p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" /> Bắt đầu học
                    </span>
                    <span className="text-primary group-hover:translate-x-1 transition-transform">
                      →
                    </span>
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
