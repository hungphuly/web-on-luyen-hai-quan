'use client'

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, AlertTriangle } from 'lucide-react';
import { batDauThiThu } from './actions';
import { DeThi, KetQuaThiThu } from '@/lib/modules/thi-thu/types';
import { ThiThuSession } from './ThiThuSession';
import { ThiThuResult } from './ThiThuResult';
import Link from 'next/link';

export function ThiThuClientWrapper({ chuyenDeId, chuyenDeTen }: { chuyenDeId: string, chuyenDeTen: string }) {
  const [step, setStep] = useState<'idle' | 'testing' | 'result'>('idle');
  const [deThi, setDeThi] = useState<DeThi | null>(null);
  const [ketQua, setKetQua] = useState<KetQuaThiThu | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStart = () => {
    startTransition(async () => {
      try {
        const data = await batDauThiThu(chuyenDeId);
        if (data) {
          setDeThi(data);
          setStep('testing');
        } else {
          alert('Không thể tạo đề thi lúc này. Có thể chưa có câu hỏi nào.');
        }
      } catch (error) {
        alert('Lỗi tạo đề thi.');
      }
    });
  };

  if (step === 'idle') {
    return (
      <div className="bg-white rounded-xl border p-6 md:p-10 text-center space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Thi thử: {chuyenDeTen}</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-800 text-left space-y-2 max-w-lg mx-auto">
          <p className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Quy định thi thử
          </p>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li>Số lượng câu hỏi: Tối đa 20 câu ngẫu nhiên.</li>
            <li>Thời gian làm bài: 30 phút. Hết giờ hệ thống tự động nộp bài.</li>
            <li>Có thể xem lại và thay đổi đáp án trước khi nộp.</li>
            <li><strong className="text-red-600">Tuyệt đối không tải lại trang (Refresh / F5)</strong> khi đang thi, nếu không bài thi sẽ bị mất và không được ghi nhận.</li>
            <li>Điểm số và đáp án chỉ hiển thị SAU KHI nộp bài.</li>
          </ul>
        </div>
        <Button onClick={handleStart} disabled={isPending} size="lg" className="px-8 text-lg rounded-full">
          {isPending ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <PlayCircle className="w-6 h-6 mr-2" />}
          Bắt đầu thi ngay
        </Button>
        <div className="mt-4">
          <Link href={`/on-luyen/${chuyenDeTen}`} className="text-sm text-gray-500 hover:underline">
            Quay lại trang Ôn Luyện
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'testing' && deThi) {
    return (
      <ThiThuSession 
        deThi={deThi} 
        chuyenDeTen={chuyenDeTen} 
        onFinish={(kq) => {
          setKetQua(kq);
          setStep('result');
        }} 
      />
    );
  }

  if (step === 'result' && ketQua) {
    return (
      <ThiThuResult 
        ketQua={ketQua} 
        chuyenDeTen={chuyenDeTen} 
      />
    );
  }

  return null;
}
