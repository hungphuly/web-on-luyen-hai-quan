import { notFound } from 'next/navigation';
import { getChuyenDeBySlug } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { getDanhSachVideo, getVideoTienDoList } from '@/lib/modules/bai-giang/services/video.service';
import { getDanhSachLyThuyet, getTienDoList } from '@/lib/modules/bai-giang/services/ly-thuyet.service';
import { ChuyenDeClient } from './ChuyenDeClient';

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

  const [videos, lyThuyetList, tienDoLyThuyet, tienDoVideo] = await Promise.all([
    getDanhSachVideo(chuyenDe.id),
    getDanhSachLyThuyet(chuyenDe.id),
    getTienDoList(),
    getVideoTienDoList()
  ]);

  // Mix videos and ly_thuyet by thu_tu
  const mixedItems = [
    ...videos.map(v => ({ ...v, type: 'video' as const })),
    ...lyThuyetList.map(l => ({ ...l, type: 'ly_thuyet' as const }))
  ].sort((a, b) => a.thu_tu - b.thu_tu);

  return (
    <div className="bg-white">
      <ChuyenDeClient 
        chuyenDe={chuyenDe} 
        items={mixedItems}
        tienDoLyThuyet={tienDoLyThuyet}
        tienDoVideo={tienDoVideo}
      />
    </div>
  );
}
