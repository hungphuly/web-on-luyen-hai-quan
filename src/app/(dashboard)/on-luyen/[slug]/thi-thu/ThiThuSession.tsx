'use client'

import { useState, useEffect, useTransition } from 'react';
import { DeThi, KetQuaThiThu } from '@/lib/modules/thi-thu/types';
import { nopBaiThiThu } from './actions';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThiThuSession({ deThi, chuyenDeTen, onFinish }: { deThi: DeThi, chuyenDeTen: string, onFinish: (kq: KetQuaThiThu) => void }) {
  const [timeLeft, setTimeLeft] = useState(deThi.thoiGianLamBai);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  // Đếm ngược thời gian
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!isPending) handleSubmit(); // Hết giờ tự nộp
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleSelect = (cauHoiId: string, optionKey: string, isMulti: boolean) => {
    if (isPending) return;

    setAnswers(prev => {
      const currentList = prev[cauHoiId] || [];
      if (isMulti) {
        const nextList = currentList.includes(optionKey)
          ? currentList.filter(k => k !== optionKey)
          : [...currentList, optionKey];
        return {
          ...prev,
          [cauHoiId]: nextList.sort()
        };
      } else {
        return {
          ...prev,
          [cauHoiId]: [optionKey]
        };
      }
    });
  };

  const handleSubmit = () => {
    const answeredCount = Object.values(answers).filter(arr => arr && arr.length > 0).length;
    if (answeredCount === 0) {
      alert('Bạn chưa làm câu hỏi nào');
      return;
    }
    
    const isConfirm = window.confirm(`Bạn đã làm ${answeredCount}/${deThi.cauHoi.length} câu. Bạn có chắc chắn muốn nộp bài?`);
    if (!isConfirm) return;

    startTransition(async () => {
      try {
        const payload = deThi.cauHoi.map(c => {
          const selectedList = answers[c.id] || [];
          return {
            cauHoiId: c.id,
            luaChon: selectedList.length > 0 ? selectedList.join(',') : null,
            noiDung: c.noi_dung,
            cacLuaChon: c.cac_lua_chon
          };
        });
        
        const thoiGianDaLam = deThi.thoiGianLamBai - timeLeft;
        const ketQua: any = await nopBaiThiThu(deThi.phienThiId, deThi.chuyenDeId, payload, thoiGianDaLam);
        
        if (ketQua?.error) {
          alert('Lỗi: ' + ketQua.error);
        } else {
          onFinish(ketQua);
        }
      } catch (error: any) {
        alert('Có lỗi khi nộp bài: ' + error.message);
      }
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const answeredCount = Object.values(answers).filter(arr => arr && arr.length > 0).length;

  return (
    <div className="space-y-6 pt-20">
      {/* Thanh công cụ cố định trên cùng */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="font-bold text-gray-800 hidden md:block truncate max-w-xs xl:max-w-md">Thi thử: {chuyenDeTen}</div>
        
        <div className="flex items-center gap-3 md:gap-6 flex-1 md:flex-none justify-start md:justify-center">
          <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
            <span className="hidden md:inline">Đã làm: </span>
            <span className="text-primary font-bold">{answeredCount}</span>/{deThi.cauHoi.length}
          </div>
          
          <div className={cn(
            "flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-full ml-auto md:ml-0",
            timeLeft <= 300 ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-50 text-blue-700"
          )}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isPending} className="rounded-full shadow-md font-bold shrink-0 ml-4">
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2 hidden sm:block" />}
          Nộp bài
        </Button>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="space-y-8 max-w-3xl mx-auto">
        {deThi.cauHoi.map((q, i) => {
          const isMulti = Boolean(q.la_nhieu_dap_an);
          const currentSelected = answers[q.id] || [];
          const shapeClass = isMulti ? "rounded-lg" : "rounded-full";

          return (
            <div key={q.id} className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                {isMulti ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Chọn nhiều đáp án đúng (Ô vuông)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                    Chọn 1 đáp án đúng (Ô tròn)
                  </span>
                )}
              </div>

              <h3 className="font-bold text-lg flex gap-3 items-start text-gray-900">
                <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{q.noi_dung}</span>
              </h3>

              <div className="space-y-3">
                {Object.entries(q.cac_lua_chon).map(([key, val]) => {
                  if (!val) return null;
                  const isSelected = currentSelected.includes(key);

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelect(q.id, key, isMulti)}
                      disabled={isPending}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 group cursor-pointer",
                        isSelected 
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20" 
                          : "border-gray-200 hover:border-primary/30 text-gray-700 bg-white"
                      )}
                    >
                      <div className={cn(
                        `w-7 h-7 shrink-0 ${shapeClass} border-2 flex items-center justify-center font-bold text-sm transition-colors`,
                        isSelected 
                          ? "border-primary bg-primary text-white" 
                          : "border-gray-300 group-hover:border-primary/50 text-gray-500 bg-transparent"
                      )}>
                        {key.toUpperCase()}
                      </div>
                      <span className="mt-0.5 leading-relaxed font-medium flex-1">{val as string}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
