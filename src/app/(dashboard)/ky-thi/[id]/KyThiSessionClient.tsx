'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { KyThi, KyThiPhienLamBai } from '@/lib/modules/ky-thi/types';
import { saveKyThiAnswer, submitKyThi } from '@/lib/modules/ky-thi/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Props {
  session: KyThiPhienLamBai;
  kyThi: KyThi;
}

export function KyThiSessionClient({ session, kyThi }: Props) {
  const router = useRouter();
  const isCompleted = session.trang_thai === 'da_nop';
  
  const [answers, setAnswers] = useState<Record<string, string>>(session.bai_lam_tam_thoi || {});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Anti-cheat mechanisms
  useEffect(() => {
    if (isCompleted) return;
    
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+C
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.key === 'c')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCompleted]);

  // Timer logic
  useEffect(() => {
    if (isCompleted) return;

    const startTime = new Date(session.bat_dau_luc).getTime();
    const durationMs = kyThi.thoi_gian_lam_bai * 60 * 1000;
    const endTime = startTime + durationMs;

    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);

      if (remaining === 0) {
        handleFinalSubmit(); // Auto submit when time is up
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.bat_dau_luc, kyThi.thoi_gian_lam_bai, isCompleted]);

  const handleSelect = (questionId: string, value: string) => {
    if (isCompleted) return;
    
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    setAutoSaveStatus('saving');
    // We don't block the UI, fire and forget
    saveKyThiAnswer(kyThi.id, questionId, value).then(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    });
  };

  const handleFinalSubmit = () => {
    startTransition(async () => {
      const res = await submitKyThi(kyThi.id);
      if (res.error) {
        alert(res.error);
      } else {
        setShowConfirm(false);
        router.refresh();
      }
    });
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const questions: any[] = session.danh_sach_cau_hoi;

  // Render mode: View Results
  if (isCompleted) {
    const results = session.ket_qua || {};
    const correctCount = Object.values(results).filter((r: any) => r.isCorrect).length;
    
    return (
      <div className="space-y-6 select-none pb-24">
        <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm text-center border-t-4 border-t-primary">
          <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 text-green-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Đã nộp bài</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Kỳ thi: <span className="font-semibold text-gray-900">{kyThi.ten_ky_thi}</span></p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto mb-6">
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center gap-1 border">
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Số câu đúng</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">{correctCount} / {questions.length}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center gap-1 border">
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Điểm số</span>
              <span className="text-3xl sm:text-4xl font-black text-primary">{session.diem_so} / 10</span>
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <Link href="/ky-thi">
              <Button className="rounded-xl font-bold">Quay lại danh sách</Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border">
          <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 border-b pb-3 text-gray-900">Chi tiết bài làm (Bảo mật đề thi: Không hiển thị đáp án đúng)</h3>
          
          <div className="space-y-8">
            {questions.map((q, idx) => {
              const res = results[q.id];
              const isCorrect = res?.isCorrect;
              const selected = res?.selected;

              return (
                <div key={q.id} className={cn("p-4 rounded-lg border", isCorrect ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200")}>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-bold text-gray-900 flex gap-2">
                          <span>Câu {idx + 1}:</span>
                          <span dangerouslySetInnerHTML={{ __html: q.noi_dung.replace(/\n/g, '<br/>') }} />
                        </h4>
                        {isCorrect ? (
                          <span className="shrink-0 px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> ĐÚNG
                          </span>
                        ) : (
                          <span className="shrink-0 px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-xs flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> SAI
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['a', 'b', 'c', 'd'].map(key => {
                          const val = q.cac_lua_chon[key];
                          if (!val) return null;
                          const isSelected = selected === key;
                          
                          return (
                            <div 
                              key={key} 
                              className={cn(
                                "p-3 rounded-lg border text-sm flex items-start gap-3",
                                isSelected ? (isCorrect ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400") : "bg-white text-gray-700"
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5",
                                isSelected ? (isCorrect ? "bg-green-600 text-white" : "bg-red-600 text-white") : "bg-gray-100 text-gray-600"
                              )}>
                                {key.toUpperCase()}
                              </div>
                              <span className={isSelected ? "font-semibold text-gray-900" : ""}>{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render mode: Taking Exam
  return (
    <div className="flex flex-col md:flex-row gap-6 relative select-none">
      {/* Mobile Sticky Header Bar */}
      <div className="md:hidden sticky top-14 -mx-4 -mt-4 mb-2 px-4 py-2.5 bg-white/95 backdrop-blur-md border-b shadow-sm z-20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
            <span className="text-primary font-bold">{Object.keys(answers).length}</span>/{questions.length}
          </span>
          {autoSaveStatus === 'saving' && (
            <span className="text-[11px] text-blue-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              <span className="hidden sm:inline">Lưu...</span>
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-[11px] text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Đã lưu</span>
            </span>
          )}
        </div>

        <div className={cn(
          "flex items-center gap-1.5 font-mono text-base font-bold px-3 py-1 rounded-full shrink-0",
          timeLeft < 300000 ? "bg-red-100 text-red-600 animate-pulse" : "bg-primary/10 text-primary"
        )}>
          <Clock className="w-4 h-4 shrink-0" />
          {formatTime(timeLeft)}
        </div>

        <Button 
          size="sm"
          className="h-8 px-3 text-xs font-bold shrink-0 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-xs"
          onClick={() => setShowConfirm(true)}
        >
          Nộp bài
        </Button>
      </div>

      {/* Main question list */}
      <div className="flex-1 min-w-0 space-y-6 pb-6 md:pb-24">
        {questions.map((q, idx) => (
          <div key={q.id} id={`q-${idx}`} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border scroll-mt-32">
            <h3 className="font-bold text-base sm:text-lg mb-4 text-gray-900 flex gap-2.5 items-start">
              <span className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-bold mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: q.noi_dung.replace(/\n/g, '<br/>') }} />
            </h3>
            
            <div className="space-y-2.5 sm:space-y-3 pl-0 sm:pl-10">
              {['a', 'b', 'c', 'd'].map(key => {
                const val = q.cac_lua_chon[key];
                if (!val) return null;
                const isSelected = answers[q.id] === key;
                
                return (
                  <label 
                    key={key} 
                    className={cn(
                      "flex items-start gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50/80",
                      isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-gray-200"
                    )}
                  >
                    <input 
                      type="radio" 
                      name={`q-${q.id}`} 
                      value={key}
                      checked={isSelected}
                      onChange={() => handleSelect(q.id, key)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-xs mt-0.5 transition-colors",
                      isSelected ? "border-primary bg-primary text-white" : "border-gray-300 text-gray-500 group-hover:border-primary/50"
                    )}>
                      {key.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className={cn("text-sm sm:text-base leading-relaxed break-words", isSelected ? "font-medium text-gray-900" : "text-gray-700")}>
                        {val}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Mobile Question List Grid & Bottom Submit Button */}
        <div className="block md:hidden bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Danh sách câu hỏi
            </h3>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {Object.keys(answers).length}/{questions.length} đã làm
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              return (
                <a 
                  key={q.id} 
                  href={`#q-${idx}`}
                  className={cn(
                    "flex items-center justify-center w-full aspect-square rounded-lg text-xs sm:text-sm font-bold border transition-colors",
                    isAnswered ? "bg-primary text-white border-primary shadow-xs" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  {idx + 1}
                </a>
              );
            })}
          </div>

          <div className="pt-2 border-t space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Tự động lưu bài làm</span>
              {autoSaveStatus === 'saving' && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Đang lưu...</span>}
              {autoSaveStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Đã lưu nháp</span>}
              {autoSaveStatus === 'idle' && <span className="text-gray-400">Đã đồng bộ</span>}
            </div>

            <Button 
              className="w-full h-12 text-base font-bold shadow-md bg-primary hover:bg-primary/90 text-white rounded-xl" 
              onClick={() => setShowConfirm(true)}
            >
              NỘP BÀI THI
            </Button>
          </div>
        </div>
      </div>
      
      {/* Desktop Sidebar navigation */}
      <div className="hidden md:block md:w-80 md:shrink-0">
        <div className="sticky top-20 bg-white rounded-xl shadow-md border p-6 flex flex-col h-[calc(100vh-6rem)]">
          
          <div className="text-center mb-6 border-b pb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thời gian còn lại</h2>
            <div className={cn(
              "text-3xl lg:text-4xl font-black font-mono flex items-center justify-center gap-2",
              timeLeft < 300000 ? "text-red-600 animate-pulse" : "text-primary"
            )}>
              <Clock className="w-7 h-7" />
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 mb-6 pr-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700">Danh sách câu hỏi</h3>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {Object.keys(answers).length}/{questions.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                return (
                  <a 
                    key={q.id} 
                    href={`#q-${idx}`}
                    className={cn(
                      "flex items-center justify-center w-full aspect-square rounded-lg text-sm font-bold border transition-colors",
                      isAnswered ? "bg-primary text-white border-primary shadow-xs" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    )}
                  >
                    {idx + 1}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-3 pt-3 border-t">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-gray-500">Trạng thái:</span>
              {autoSaveStatus === 'saving' && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Đang lưu...</span>}
              {autoSaveStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Đã lưu nháp</span>}
              {autoSaveStatus === 'idle' && <span className="text-gray-400">Đã đồng bộ</span>}
            </div>

            <Button 
              className="w-full h-12 text-base font-bold shadow-md bg-primary hover:bg-primary/90 text-white rounded-xl" 
              onClick={() => setShowConfirm(true)}
            >
              NỘP BÀI
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              Xác nhận nộp bài
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Bạn đã làm <strong className="text-primary">{Object.keys(answers).length} / {questions.length}</strong> câu hỏi.
            </p>
            {Object.keys(answers).length < questions.length && (
              <p className="text-amber-600 bg-amber-50 p-3 rounded-lg text-sm font-medium border border-amber-200">
                Chú ý: Vẫn còn câu hỏi chưa được chọn đáp án. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
              </p>
            )}
            <p className="text-gray-500 text-sm mt-4 italic">
              * Khi đã nộp bài, bạn sẽ không thể thay đổi đáp án.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending}>Tiếp tục làm bài</Button>
            <Button onClick={handleFinalSubmit} disabled={isPending} className="bg-primary hover:bg-primary/90">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận NỘP BÀI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
