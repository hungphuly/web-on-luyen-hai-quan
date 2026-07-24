'use client'

import { useState, useTransition } from 'react';
import { Flashcard } from '@/lib/modules/flashcard/types';
import { ghiNhanTienDoFlashcard } from './actions';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCw, Sparkles, Loader2, PartyPopper } from 'lucide-react';
import Link from 'next/link';

export function FlashcardSession({ cards }: { cards: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [finished, setFinished] = useState(false);

  if (cards.length === 0 || finished) {
    return (
      <div className="bg-white p-12 rounded-xl border text-center flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <PartyPopper className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Tuyệt vời!</h2>
        <p className="text-muted-foreground max-w-md">
          Bạn đã hoàn thành tất cả thẻ ghi nhớ đến hạn của chuyên đề này. Hãy quay lại vào ngày mai để tiếp tục ôn tập nhé!
        </p>
        <Link href="/flashcards">
          <Button size="lg" className="mt-4">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    if (!isPending) setIsFlipped(!isFlipped);
  };

  const handleAnswer = (nho: boolean) => {
    startTransition(async () => {
      try {
        await ghiNhanTienDoFlashcard(currentCard.id, nho);
        // Chuyển thẻ tiếp theo
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setIsFlipped(false);
        } else {
          setFinished(true);
        }
      } catch (error: any) {
        alert(error.message || 'Có lỗi xảy ra');
      }
    });
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
      {/* Thanh tiến độ */}
      <div className="w-full mb-8 flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>Đang học thẻ {currentIndex + 1} / {cards.length}</span>
        <div className="flex gap-1">
          {cards.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 w-6 rounded-full ${idx < currentIndex ? 'bg-primary' : idx === currentIndex ? 'bg-primary/50' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      {/* Thẻ Flashcard - Tạo hiệu ứng lật thẻ (Flip) */}
      <div 
        className="relative w-full aspect-[4/3] sm:aspect-[3/2] cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div className={`w-full h-full transition-transform duration-500 transform-style-preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Mặt trước */}
          <div className="absolute w-full h-full backface-hidden bg-white border-2 border-primary/20 rounded-2xl shadow-md p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <span className="absolute top-6 left-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Thuật ngữ
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-primary">
              {currentCard.mat_truoc}
            </h3>
            <div className="absolute bottom-6 flex flex-col items-center text-muted-foreground animate-bounce opacity-70">
              <span className="text-xs mb-1">Chạm để lật</span>
              <RotateCw className="w-4 h-4" />
            </div>
          </div>

          {/* Mặt sau */}
          <div className="absolute w-full h-full backface-hidden bg-primary text-primary-foreground rounded-2xl shadow-xl p-8 md:p-12 flex flex-col items-center justify-center text-center rotate-y-180">
            <span className="absolute top-6 left-6 text-xs font-bold text-primary-foreground/70 uppercase tracking-widest">
              Định nghĩa
            </span>
            <p className="text-xl md:text-2xl font-medium leading-relaxed">
              {currentCard.mat_sau}
            </p>
          </div>
          
        </div>
      </div>

      {/* Cụm nút hành động (Chỉ hiện khi đã lật mặt sau) */}
      <div className={`w-full mt-12 grid grid-cols-2 gap-4 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <Button 
          variant="outline" 
          size="lg" 
          className="h-16 text-lg border-red-200 hover:bg-red-50 hover:text-red-700 font-bold"
          onClick={() => handleAnswer(false)}
          disabled={isPending || !isFlipped}
        >
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <X className="w-6 h-6 mr-2" />}
          Quên
        </Button>
        <Button 
          size="lg" 
          className="h-16 text-lg bg-green-600 hover:bg-green-700 text-white font-bold"
          onClick={() => handleAnswer(true)}
          disabled={isPending || !isFlipped}
        >
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6 mr-2" />}
          Nhớ
        </Button>
      </div>
    </div>
  );
}
