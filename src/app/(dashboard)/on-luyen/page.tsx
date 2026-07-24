import Link from 'next/link';
import { getDanhSachChuyenDeCoCauHoi } from '@/lib/modules/on-luyen/services/on-luyen.service';
import { BookOpen, CheckCircle, GraduationCap } from 'lucide-react';

export const metadata = {
  title: 'Ôn luyện Trắc nghiệm - Ôn Luyện Hải Quan',
};

export default async function OnLuyenPage() {
  const chuyenDeList = await getDanhSachChuyenDeCoCauHoi();

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">Ôn luyện trắc nghiệm</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-8">Lựa chọn chuyên đề để làm bài tập trắc nghiệm củng cố kiến thức.</p>
      </div>

      {chuyenDeList.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-muted-foreground">
          Chưa có chuyên đề nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chuyenDeList.map((cd) => (
            <Link key={cd.id} href={`/on-luyen/${cd.slug}`} className="group">
              <div className="bg-white rounded-xl border border-primary/20 shadow-sm overflow-hidden h-full flex flex-col transition-all hover:shadow-md hover:border-primary/40 relative">
                {cd.cau_hoi_count > 0 && (
                  <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                    Sẵn sàng
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="bg-sidebar-active-bg w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">{cd.ten}</h3>
                  {cd.mo_ta && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{cd.mo_ta}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-600 mt-auto pt-4 border-t">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-accent" />
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
