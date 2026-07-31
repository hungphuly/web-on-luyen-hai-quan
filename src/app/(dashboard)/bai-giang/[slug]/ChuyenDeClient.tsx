'use client'

import React, { useState, useEffect } from 'react';
import { BaiGiangVideo, BaiGiangLyThuyet, TienDoHocLieu, VideoTienDo } from '@/lib/modules/bai-giang/types';
import { Lock, CheckCircle2, PlayCircle, FileText, Menu, X } from 'lucide-react';
import { YoutubePlayerClient } from './YoutubePlayerClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CompleteButton } from './CompleteButton';
import { PdfViewer } from '@/components/shared/PdfViewer';
import Link from 'next/link';

type LessonItem = 
  | (BaiGiangVideo & { type: 'video' }) 
  | (BaiGiangLyThuyet & { type: 'ly_thuyet' });

interface ChuyenDeClientProps {
  chuyenDe: { id: string; ten: string; slug: string; mo_ta: string | null };
  items: LessonItem[];
  tienDoLyThuyet: TienDoHocLieu[];
  tienDoVideo: VideoTienDo[];
}

export function ChuyenDeClient({ chuyenDe, items, tienDoLyThuyet, tienDoVideo }: ChuyenDeClientProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Helper function: kiểm tra hoàn thành
  const isCompleted = (item: LessonItem) => {
    if (item.type === 'video') {
      return tienDoVideo.some(td => td.bai_giang_video_id === item.id && td.da_hoan_thanh);
    } else {
      return tienDoLyThuyet.some(td => td.bai_ly_thuyet_id === item.id && td.da_hoan_thanh);
    }
  };

  // Tính toán trạng thái khóa cho từng bài
  const getItemStatus = (index: number) => {
    if (index === 0) return { locked: false, completed: isCompleted(items[0]) };
    const prevItem = items[index - 1];
    const prevCompleted = isCompleted(prevItem);
    return {
      locked: !prevCompleted,
      completed: isCompleted(items[index])
    };
  };

  // Khởi tạo activeId hợp lý (bài chưa hoàn thành đầu tiên)
  useEffect(() => {
    if (!activeId && items.length > 0) {
      const firstUncompleted = items.find((_, i) => !getItemStatus(i).completed && !getItemStatus(i).locked);
      setActiveId(firstUncompleted ? firstUncompleted.id : items[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tienDoLyThuyet, tienDoVideo]);

  const activeItemIndex = items.findIndex(i => i.id === activeId);
  const activeItem = items[activeItemIndex];
  const activeStatus = activeItem ? getItemStatus(activeItemIndex) : { locked: false, completed: false };

  // Helper tính % video (để truyền vào player)
  const getVideoProgress = (videoId: string) => {
    const td = tienDoVideo.find(t => t.bai_giang_video_id === videoId);
    return td ? td.phan_tram_da_xem : 0;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] border-t bg-gray-50/50">
      
      {/* Nút bật/tắt sidebar trên Mobile */}
      <div className="lg:hidden p-4 border-b bg-white flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h2 className="font-bold text-primary truncate max-w-[250px]">{chuyenDe.ten}</h2>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-100 rounded-md">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* CỘT TRÁI - MAIN CONTENT */}
      <div className="flex-1 p-0 lg:p-6 lg:overflow-y-auto">
        {activeItem ? (
          <div className="w-full max-w-[1600px] mx-auto space-y-6 lg:border lg:rounded-2xl lg:bg-white lg:shadow-sm lg:p-6">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">{activeItem.tieu_de}</h1>
              {activeItem.type === 'ly_thuyet' && activeItem.hinh_anh_url && (
                <div className="mt-4 rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeItem.hinh_anh_url} alt={activeItem.tieu_de} className="w-full h-auto max-h-[400px] object-cover" />
                </div>
              )}
            </div>

            {activeStatus.locked ? (
              <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Bài học đã bị khóa</h3>
                <p className="text-gray-500">Vui lòng hoàn thành các bài học trước đó để mở khóa nội dung này.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden">
                {activeItem.type === 'video' ? (
                  <div className="flex flex-col">
                    <YoutubePlayerClient 
                      videoId={activeItem.id} 
                      youtubeId={activeItem.youtube_id} 
                      slug={chuyenDe.slug}
                      initialProgress={getVideoProgress(activeItem.id)}
                    />
                    {activeItem.mo_ta && (
                      <div className="p-6 border-t text-gray-700">
                        <p>{activeItem.mo_ta}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 md:p-8">
                    <article className="prose prose-slate max-w-none prose-headings:font-sans prose-headings:font-bold prose-headings:text-primary prose-a:text-accent">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {activeItem.noi_dung_markdown}
                      </ReactMarkdown>
                    </article>

                    {(activeItem as any).file_dinh_kem_url && (
                      <div className="mt-8 border rounded-lg overflow-hidden h-[75vh] w-full">
                        <PdfViewer fileKey={(activeItem as any).file_dinh_kem_url} isModal={false} />
                      </div>
                    )}

                    <div className="mt-10 pt-6 border-t flex justify-end">
                      {activeStatus.completed ? (
                        <div className="inline-flex items-center text-green-600 font-medium px-4 py-2 bg-green-50 rounded-lg">
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Đã hoàn thành
                        </div>
                      ) : (
                        <CompleteButton lessonId={activeItem.id} slug={chuyenDe.slug} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Chưa có bài học nào.
          </div>
        )}
      </div>

      {/* CỘT PHẢI - SIDEBAR */}
      <div className={`
        fixed inset-0 z-10 bg-white lg:static lg:block lg:w-[380px] shrink-0 border-l lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16
        ${isSidebarOpen ? 'block pt-16' : 'hidden'}
      `}>
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-1">Mục lục</h3>
          <p className="font-bold text-primary truncate" title={chuyenDe.ten}>{chuyenDe.ten}</p>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-10rem)] p-4 space-y-2">
          {items.map((item, index) => {
            const status = getItemStatus(index);
            const isActive = item.id === activeId;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveId(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all flex gap-3 items-start
                  ${isActive ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200'}
                  ${status.locked ? 'opacity-60' : ''}
                `}
              >
                <div className="mt-0.5 shrink-0">
                  {status.locked ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : status.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : item.type === 'video' ? (
                    <PlayCircle className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                  ) : (
                    <FileText className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold mb-1 uppercase tracking-wider ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                    {item.type === 'video' ? 'Video' : 'Lý thuyết'} • {index + 1}
                  </div>
                  <h4 className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                    {item.tieu_de}
                  </h4>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t bg-gray-50">
          <Link 
            href={`/thi-thu`}
            className="w-full block text-center py-2 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Đến bài Thi Thử
          </Link>
        </div>
      </div>
    </div>
  );
}
