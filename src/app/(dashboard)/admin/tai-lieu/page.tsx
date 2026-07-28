'use client'

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { uploadVanBanPhapLuat } from './actions';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AdminTaiLieuList } from './AdminTaiLieuList';

export default function AdminTaiLieuPage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: string, error?: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await uploadVanBanPhapLuat(formData);
        if (res?.error) {
          setResult({ error: res.error });
        } else {
          setResult({ success: 'Đã tải lên văn bản thành công!' });
          (e.target as HTMLFormElement).reset();
        }
      } catch (error: any) {
        setResult({ error: error.message || 'Lỗi khi tải lên' });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Thêm mới Tài Liệu Pháp Luật</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white border rounded-xl shadow-sm">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên văn bản (Bắt buộc)</label>
          <input 
            type="text" 
            name="ten_van_ban" 
            required
            className="w-full border p-2 rounded-lg"
            placeholder="VD: Luật Hải quan 2014"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số hiệu</label>
          <input 
            type="text" 
            name="so_hieu" 
            className="w-full border p-2 rounded-lg"
            placeholder="VD: 54/2014/QH13"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ban hành</label>
            <input 
              type="date" 
              name="ngay_ban_hanh" 
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hiệu lực</label>
            <input 
              type="date" 
              name="ngay_het_hieu_luc" 
              className="w-full border p-2 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái hiệu lực</label>
          <select name="trang_thai" className="w-full border p-2 rounded-lg">
            <option value="Còn hiệu lực">Còn hiệu lực</option>
            <option value="Hết hiệu lực">Hết hiệu lực</option>
            <option value="Sắp có hiệu lực">Sắp có hiệu lực</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File PDF đính kèm (Bắt buộc)</label>
          <input 
            type="file" 
            name="file"
            accept=".pdf"
            required
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary/90"
          />
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
            Tải lên văn bản
          </Button>
        </div>
      </form>

      <div className="pt-8 border-t">
        <AdminTaiLieuList />
      </div>
    </div>
  );
}
