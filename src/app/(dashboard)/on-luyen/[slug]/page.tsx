import { notFound } from 'next/navigation';
import { getChuyenDeBySlug } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { getDanhSachCauHoiPublic } from '@/lib/modules/on-luyen/services/on-luyen.service';
import { OnLuyenSession } from './OnLuyenSession';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chuyenDe = await getChuyenDeBySlug(slug);
  return {
    title: chuyenDe ? `Ôn luyện: ${chuyenDe.ten} - Ôn Luyện Hải Quan` : 'Chuyên đề không tồn tại',
  };
}

export default async function OnLuyenDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chuyenDe = await getChuyenDeBySlug(slug);

  if (!chuyenDe) {
    notFound();
  }

  const questions = await getDanhSachCauHoiPublic(chuyenDe.id);

  return (
    <div className="max-w-[800px] mx-auto p-4 lg:p-6 space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{chuyenDe.ten}</h1>
          <p className="text-sm text-gray-500">Chế độ: Ôn luyện tự do</p>
        </div>
        <Link 
          href={`/on-luyen/${chuyenDe.slug}/thi-thu`}
          className="inline-flex items-center justify-center px-4 py-2 bg-rose-50 text-rose-600 font-bold border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
        >
          Thi thử ngay
        </Link>
      </div>

      <OnLuyenSession questions={questions} chuyenDeTen={chuyenDe.ten} />
    </div>
  );
}
