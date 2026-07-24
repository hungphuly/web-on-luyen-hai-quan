import Link from 'next/link';
import { getDanhSachChuyenDe } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { BookOpen, PlayCircle, Library } from 'lucide-react';

export const metadata = {
  title: 'Bài giảng & Lý thuyết - Ôn Luyện Hải Quan',
};

export default async function BaiGiangPage() {
  const chuyenDeList = await getDanhSachChuyenDe();

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">Danh mục Chuyên đề</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-8">Lựa chọn chuyên đề để bắt đầu ôn luyện kiến thức và bài tập.</p>
      </div>

      {chuyenDeList.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-muted-foreground">
          Chưa có chuyên đề nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chuyenDeList.map((cd) => (
            <Link key={cd.id} href={`/bai-giang/${cd.slug}`} className="group">
              <div className="bg-white rounded-xl border border-primary/20 shadow-sm overflow-hidden h-full flex flex-col transition-all hover:shadow-md hover:border-primary/40">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="bg-sidebar-active-bg w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <Library className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">{cd.ten}</h3>
                  {cd.mo_ta && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{cd.mo_ta}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-600 mt-auto pt-4 border-t">
                    <div className="flex items-center gap-1.5">
                      <PlayCircle className="w-4 h-4 text-accent" />
                      <span>{cd.video_count} Video</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span>{cd.ly_thuyet_count} Bài học</span>
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
