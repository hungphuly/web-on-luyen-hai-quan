import { notFound } from 'next/navigation';
import { getChuyenDeBySlug } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { getFlashcardsDenHan } from '@/lib/modules/flashcard/services/flashcard.service';
import { FlashcardSession } from './FlashcardSession';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chuyenDe = await getChuyenDeBySlug(slug);
  return {
    title: chuyenDe ? `Flashcard: ${chuyenDe.ten} - Ôn Luyện Hải Quan` : 'Chuyên đề không tồn tại',
  };
}

export default async function FlashcardDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chuyenDe = await getChuyenDeBySlug(slug);

  if (!chuyenDe) {
    notFound();
  }

  const cards = await getFlashcardsDenHan(chuyenDe.id);

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/flashcards" className="text-muted-foreground hover:text-primary transition-colors">
          <div className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </Link>
        <div>
          <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Thẻ ghi nhớ</div>
          <h1 className="text-2xl font-sans font-bold text-gray-900">{chuyenDe.ten}</h1>
        </div>
      </div>

      <FlashcardSession cards={cards} />
    </div>
  );
}
