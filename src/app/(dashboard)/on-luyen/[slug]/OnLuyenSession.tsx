'use client'

import { useState, useTransition } from 'react';
import { CauHoiPublic, KetQuaChamDiem } from '@/lib/modules/on-luyen/types';
import { chamDiemCauHoi } from './actions';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, BookOpen, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function OnLuyenSession({ questions, chuyenDeTen }: { questions: CauHoiPublic[], chuyenDeTen: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<KetQuaChamDiem | null>(null);
  const [isPending, startTransition] = useTransition();

  // Khởi tạo phien_id 1 lần duy nhất khi render lần đầu
  const [phienId] = useState(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'fallback-session-id');

  if (questions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border text-center text-muted-foreground">
        Chuyên đề này chưa có câu hỏi nào để ôn luyện.
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelect = (key: string) => {
    // Không cho đổi nếu đang chấm hoặc đã chấm
    if (isPending || result) return;
    setSelectedOption(key);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;

    startTransition(async () => {
      try {
        const res: any = await chamDiemCauHoi(question.id, selectedOption, phienId);
        if (res?.error) {
          alert(res.error);
        } else {
          setResult(res);
        }
      } catch (error: any) {
        alert(error.message || 'Có lỗi xảy ra khi chấm điểm');
      }
    });
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setResult(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Header trạng thái */}
      <div className="bg-sidebar-active-bg px-4 py-3 border-b flex justify-between items-center text-sm font-medium">
        <div className="flex items-center gap-2 truncate pr-4">
          <Link href="/on-luyen" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-muted-foreground truncate">{chuyenDeTen}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-primary font-bold">Câu {currentIndex + 1}/{questions.length}</span>
          {result && (
            <span className={result.dung ? 'text-green-600 flex items-center' : 'text-red-600 flex items-center'}>
              {result.dung ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
              {result.dung ? 'ĐÚNG' : 'SAI'}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Nội dung câu hỏi */}
        <h3 className="text-lg font-bold text-gray-900 leading-relaxed">
          {question.noi_dung}
        </h3>

        {/* Các lựa chọn */}
        <div className="space-y-2">
          {['a', 'b', 'c', 'd'].map((key) => {
            const label = question.cac_lua_chon[key as keyof typeof question.cac_lua_chon];
            if (!label) return null;

            // Xử lý logic màu sắc sau khi có kết quả
            let itemClass = "border-gray-200 hover:border-primary/40 hover:bg-gray-50";
            let indicatorClass = "bg-gray-100 text-gray-600";

            if (selectedOption === key && !result) {
              itemClass = "border-primary bg-primary/5 ring-1 ring-primary";
              indicatorClass = "bg-primary text-white";
            } else if (result) {
              // Đã nộp
              if (result.dap_an_dung.toLowerCase() === key) {
                // Đây là đáp án ĐÚNG thật sự
                itemClass = "border-green-500 bg-green-50 ring-1 ring-green-500";
                indicatorClass = "bg-green-500 text-white";
              } else if (selectedOption === key && !result.dung) {
                // Đây là đáp án người dùng CHỌN SAI
                itemClass = "border-red-300 bg-red-50";
                indicatorClass = "bg-red-500 text-white";
              } else {
                // Các đáp án khác thì mờ đi
                itemClass = "border-gray-100 opacity-50";
              }
            }

            return (
              <div 
                key={key} 
                onClick={() => handleSelect(key)}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${itemClass} ${result ? 'cursor-default' : ''}`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold mr-3 text-sm shrink-0 transition-colors ${indicatorClass}`}>
                  {key.toUpperCase()}
                </div>
                <span className={`font-medium text-sm ${result && result.dap_an_dung.toLowerCase() === key ? 'text-green-800' : 'text-gray-700'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Khu vực thông báo kết quả chi tiết */}
        {result && (
          <div className="mt-8 p-6 rounded-lg bg-gray-50 border space-y-4">
            <h4 className="font-bold text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-primary" />
              Giải thích & Căn cứ
            </h4>
            <div className="text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>Đáp án đúng: </strong> 
                <span className="text-green-600 font-bold">{result.dap_an_dung}</span>
              </p>
              <div className="mt-2 text-primary font-medium p-3 bg-white border rounded">
                <span className="text-muted-foreground text-xs block mb-1 uppercase">Căn cứ pháp lý:</span>
                {result.can_cu_phap_ly}
              </div>
            </div>
          </div>
        )}

        {/* Nút hành động */}
        <div className="pt-6 border-t flex justify-end">
          {!result ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedOption || isPending}
              size="lg"
              className="min-w-[150px]"
            >
              {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Nộp đáp án
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              disabled={isLastQuestion}
              variant="outline"
              size="lg"
              className="min-w-[150px]"
            >
              Câu tiếp theo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
        
        {isLastQuestion && result && (
          <div className="text-center text-sm text-green-600 font-medium mt-4">
            Bạn đã hoàn thành bộ câu hỏi của chuyên đề này!
          </div>
        )}
      </div>
    </div>
  );
}
