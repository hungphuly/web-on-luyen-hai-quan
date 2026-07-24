'use client'

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { updateGioiThieu } from './actions';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminGioiThieuPage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: string, error?: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tieu_de = formData.get('tieu_de') as string;
    const noi_dung = formData.get('noi_dung') as string;

    startTransition(async () => {
      try {
        await updateGioiThieu({ tieu_de, noi_dung });
        setResult({ success: 'Đã cập nhật bài giới thiệu mới nhất thành công!' });
      } catch (error: any) {
        setResult({ error: error.message || 'Lỗi khi cập nhật' });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Cập nhật Trang Giới thiệu</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white border rounded-xl shadow-sm">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề (Bắt buộc)</label>
          <input 
            type="text" 
            name="tieu_de" 
            required
            className="w-full border p-2 rounded-lg"
            placeholder="VD: Về nền tảng Ôn Luyện Hải Quan"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung (hỗ trợ định dạng Markdown)</label>
          <textarea 
            name="noi_dung" 
            required
            rows={15}
            className="w-full border p-2 rounded-lg font-mono text-sm"
            placeholder="Viết nội dung giới thiệu ở đây..."
          ></textarea>
        </div>

        {result?.success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {result.success}
          </div>
        )}
        
        {result?.error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {result.error}
          </div>
        )}

        <div className="pt-4 border-t">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Lưu thay đổi (sẽ hiển thị ngay)
          </Button>
        </div>
      </form>
    </div>
  );
}
