import { notFound } from 'next/navigation';
import { getChuyenDeBySlug } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { getDanhSachVideo } from '@/lib/modules/bai-giang/services/video.service';
import { getDanhSachLyThuyet, getTienDoList } from '@/lib/modules/bai-giang/services/ly-thuyet.service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CompleteButton } from './CompleteButton';
import { Lock, CheckCircle2 } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chuyenDe = await getChuyenDeBySlug(slug);
  return {
    title: chuyenDe ? `${chuyenDe.ten} - Ôn Luyện Hải Quan` : 'Chuyên đề không tồn tại',
  };
}

export default async function ChuyenDeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chuyenDe = await getChuyenDeBySlug(slug);

  if (!chuyenDe) {
    notFound();
  }

  const [videos, lyThuyetList, tienDoList] = await Promise.all([
    getDanhSachVideo(chuyenDe.id),
    getDanhSachLyThuyet(chuyenDe.id),
    getTienDoList()
  ]);

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-12">
      <div>
        <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">Chuyên đề</div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">{chuyenDe.ten}</h1>
        {chuyenDe.mo_ta && (
          <p className="text-sm text-muted-foreground mt-2 mb-8">{chuyenDe.mo_ta}</p>
        )}
      </div>

      {/* KHU VỰC VIDEO */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-primary border-b pb-2">Video liên quan</h2>
        {videos.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-xl border text-center text-muted-foreground text-sm">
            Chưa có video nào cho chuyên đề này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-xl border border-primary/20 shadow-sm overflow-hidden flex flex-col">
                <div className="aspect-video w-full bg-gray-100">
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${video.youtube_id}`}
                    title={video.tieu_de}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-primary line-clamp-2 mb-2">{video.tieu_de}</h3>
                  {video.mo_ta && (
                    <p className="text-sm text-gray-500 line-clamp-3 mt-auto">{video.mo_ta}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* KHU VỰC LÝ THUYẾT */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-primary border-b pb-2">Lý thuyết liên quan</h2>
        {lyThuyetList.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-xl border text-center text-muted-foreground text-sm">
            Chưa có bài lý thuyết nào cho chuyên đề này.
          </div>
        ) : (
          <div className="space-y-8">
            {lyThuyetList.map((item, index) => {
              // Logic khóa bài: nếu bài > 1 thì kiểm tra bài trước đó đã hoàn thành chưa
              const isCompleted = tienDoList.some(td => td.bai_ly_thuyet_id === item.id && td.da_hoan_thanh);
              let isLocked = false;
              
              if (index > 0) {
                const prevItem = lyThuyetList[index - 1];
                const prevCompleted = tienDoList.some(td => td.bai_ly_thuyet_id === prevItem.id && td.da_hoan_thanh);
                if (!prevCompleted) {
                  isLocked = true;
                }
              }

              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${isLocked ? 'opacity-60 grayscale-[50%] border-gray-200' : 'border-primary/20'}`}
                >
                  <div className="bg-sidebar-active-bg px-6 py-4 border-b border-primary/10 flex justify-between items-center gap-4">
                    <div>
                      <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Bài {item.thu_tu}</div>
                      <h3 className="text-xl font-bold text-primary">{item.tieu_de}</h3>
                    </div>
                    {isLocked && <Lock className="h-5 w-5 text-gray-500 shrink-0" />}
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                  </div>
                  
                  <div className="p-6">
                    {isLocked ? (
                      <div className="text-center py-8 text-gray-500">
                        <Lock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Bài học đã bị khóa</p>
                        <p className="text-sm mt-1">Vui lòng hoàn thành bài học trước đó để mở khóa.</p>
                      </div>
                    ) : (
                      <>
                        {item.hinh_anh_url && (
                          <div className="mb-8 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={item.hinh_anh_url} 
                              alt={item.tieu_de} 
                              className="w-full h-auto max-h-[400px] object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <article className="prose prose-slate max-w-none prose-headings:font-sans prose-headings:font-bold prose-headings:text-primary prose-a:text-accent">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {item.noi_dung_markdown}
                          </ReactMarkdown>
                        </article>
                        
                        <div className="mt-10 pt-6 border-t flex justify-end">
                          {isCompleted ? (
                            <div className="inline-flex items-center text-green-600 font-medium px-4 py-2 bg-green-50 rounded-lg">
                              <CheckCircle2 className="mr-2 h-5 w-5" />
                              Đã hoàn thành
                            </div>
                          ) : (
                            <CompleteButton lessonId={item.id} slug={slug} />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
