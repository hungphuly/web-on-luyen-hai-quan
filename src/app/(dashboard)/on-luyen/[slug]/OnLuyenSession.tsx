'use client'

import { useState, useTransition } from 'react';
import { CauHoiPublic, KetQuaChamDiem } from '@/lib/modules/on-luyen/types';
import { chamDiemCauHoi } from './actions';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, BookOpen, Loader2, ArrowRight, ArrowLeft, CheckSquare, Layers } from 'lucide-react';
import Link from 'next/link';

export function OnLuyenSession({ questions, chuyenDeTen, chuyenDeId }: { questions: CauHoiPublic[], chuyenDeTen: string, chuyenDeId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [result, setResult] = useState<KetQuaChamDiem | null>(null);
  const [isPending, startTransition] = useTransition();

  // Khởi tạo phien_id 1 lần duy nhất
  const [phienId] = useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback cho HTTP
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  });

  if (questions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border text-center text-muted-foreground">
        Chuyên đề này chưa có câu hỏi nào để ôn luyện.
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isMulti = Boolean(question.la_nhieu_dap_an);

  const handleSelect = (key: string) => {
    // Không cho đổi nếu đang chấm hoặc đã chấm
    if (isPending || result) return;

    if (isMulti) {
      // Toggle lựa chọn trong mảng
      setSelectedOptions(prev => 
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
    } else {
      // Chọn 1 đáp án duy nhất
      setSelectedOptions([key]);
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) return;

    startTransition(async () => {
      try {
        const sortedAnswer = [...selectedOptions].sort().join(',');
        const res: any = await chamDiemCauHoi(question.id, sortedAnswer, phienId, chuyenDeId);
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
      setSelectedOptions([]);
      setResult(null);
    }
  };

  // Danh sách đáp án đúng được trả về từ server
  const correctAnswersList = result?.dap_an_dung
    ? result.dap_an_dung.toLowerCase().split(',').map(s => s.trim())
    : [];

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
            <span className={result.dung ? 'text-green-600 font-bold flex items-center' : 'text-red-600 font-bold flex items-center'}>
              {result.dung ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
              {result.dung ? 'ĐÚNG' : 'SAI'}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Nhãn loại câu hỏi & Nội dung câu hỏi */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isMulti ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                <CheckSquare className="w-3.5 h-3.5" />
                Câu hỏi chọn nhiều đáp án đúng (Ô vuông)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                Chọn 1 đáp án đúng (Ô tròn)
              </span>
            )}
          </div>

          <h3 className="font-bold text-lg text-gray-900 flex gap-3 items-start">
            <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm mt-0.5">
              {currentIndex + 1}
            </span>
            <span className="leading-relaxed">{question.noi_dung}</span>
          </h3>
        </div>

        {/* Các lựa chọn */}
        <div className="space-y-3">
          {['a', 'b', 'c', 'd'].map((key) => {
            const label = question.cac_lua_chon[key as keyof typeof question.cac_lua_chon];
            if (!label) return null;

            const isSelected = selectedOptions.includes(key);
            const isCorrectAnswer = correctAnswersList.includes(key);

            // Xử lý logic màu sắc sau khi có kết quả
            let itemClass = "border-gray-200 hover:border-primary/30 text-gray-700 bg-white";
            let indicatorClass = "border-gray-300 group-hover:border-primary/50 text-gray-500 bg-transparent";

            if (isSelected && !result) {
              itemClass = "border-primary bg-primary/5 text-primary ring-1 ring-primary/20";
              indicatorClass = "border-primary bg-primary text-white";
            } else if (result) {
              // Đã có kết quả chấm điểm
              if (isCorrectAnswer) {
                // Đây là 1 trong các đáp án ĐÚNG
                itemClass = "border-green-500 bg-green-50 text-green-900 font-medium";
                indicatorClass = "border-green-600 bg-green-600 text-white font-bold";
              } else if (isSelected && !isCorrectAnswer) {
                // Đây là đáp án người dùng CHỌN SAI
                itemClass = "border-red-400 bg-red-50 text-red-900";
                indicatorClass = "border-red-500 bg-red-500 text-white font-bold";
              } else {
                // Các đáp án khác
                itemClass = "border-gray-100 opacity-50 bg-white";
                indicatorClass = "border-gray-200 text-gray-400 bg-transparent";
              }
            }

            // Hình dạng ô: Ô vuông cho câu nhiều đáp án, ô tròn cho câu 1 đáp án
            const shapeClass = isMulti ? "rounded-lg" : "rounded-full";

            return (
              <button 
                key={key} 
                onClick={() => handleSelect(key)}
                disabled={!!result || isPending}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 group ${itemClass} ${result ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className={`w-7 h-7 shrink-0 ${shapeClass} border-2 flex items-center justify-center font-bold text-sm transition-colors ${indicatorClass}`}>
                  {key.toUpperCase()}
                </div>
                <span className="mt-0.5 leading-relaxed font-medium flex-1">
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Khu vực thông báo kết quả chi tiết */}
        {result && (
          <div className="mt-8 p-6 rounded-xl bg-gray-50 border space-y-4">
            <h4 className="font-bold text-gray-900 flex items-center text-base">
              <BookOpen className="w-5 h-5 mr-2 text-primary" />
              Giải thích & Căn cứ pháp lý
            </h4>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                <strong className="text-gray-900">Đáp án đúng: </strong> 
                <span className="text-green-700 font-bold text-base px-2 py-0.5 bg-green-100 rounded-md ml-1">
                  {result.dap_an_dung}
                </span>
              </p>
              <div className="text-primary font-medium p-3.5 bg-white border rounded-lg shadow-2xs">
                <span className="text-muted-foreground text-xs block mb-1 uppercase font-bold tracking-wider">Căn cứ pháp lý:</span>
                <span className="text-gray-800">{result.can_cu_phap_ly}</span>
              </div>
            </div>
          </div>
        )}

        {/* Nút hành động */}
        <div className="pt-6 border-t flex justify-end">
          {!result ? (
            <Button 
              onClick={handleSubmit} 
              disabled={selectedOptions.length === 0 || isPending}
              size="lg"
              className="min-w-[150px] font-bold"
            >
              {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Kiểm tra đáp án
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              disabled={isLastQuestion}
              variant="default"
              size="lg"
              className="min-w-[150px] font-bold"
            >
              Câu tiếp theo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
        
        {isLastQuestion && result && (
          <div className="text-center text-sm text-green-700 font-bold bg-green-50 p-3 rounded-lg border border-green-200 mt-4">
            🎉 Bạn đã hoàn thành toàn bộ câu hỏi ôn luyện trong chuyên đề này!
          </div>
        )}
      </div>
    </div>
  );
}
