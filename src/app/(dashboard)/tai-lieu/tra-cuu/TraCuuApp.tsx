'use client'

import { useState, useEffect, useTransition } from 'react';
import { getDanhSachTaiLieu } from '@/lib/modules/tai-lieu/services/tai-lieu.service';
import { Search, FileText, Eye, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function TraCuuApp({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState('');
  const [trangThai, setTrangThai] = useState<'Tất cả' | 'Còn hiệu lực' | 'Hết hiệu lực'>('Tất cả');
  const [isPending, startTransition] = useTransition();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await getDanhSachTaiLieu({ search, trangThai });
        setData(result);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, trangThai]);

  return (
    <div className="space-y-6">
      {/* Bộ lọc */}
      <div className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            type="text"
            placeholder="Tìm kiếm theo tên văn bản, số hiệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-6 text-base rounded-lg border-gray-300"
          />
        </div>
        
        <div className="flex gap-2 border-t pt-4 overflow-x-auto">
          {['Tất cả', 'Còn hiệu lực', 'Hết hiệu lực'].map((t) => (
            <button
              key={t}
              onClick={() => setTrangThai(t as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                trangThai === t 
                  ? 'bg-primary text-white shadow' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Kết quả */}
      <div className="space-y-4">
        {isPending && (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tìm kiếm...
          </div>
        )}

        {!isPending && data.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500 shadow-sm">
            Không tìm thấy văn bản nào phù hợp.
          </div>
        )}

        {!isPending && data.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 md:items-center">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0 w-fit">
              <FileText className="w-6 h-6" />
            </div>
            
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-lg text-gray-900 leading-tight">
                {doc.ten_van_ban}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Số hiệu: {doc.so_hieu}</span>
                {doc.ngay_ban_hanh && (
                  <span>Ngày ban hành: {format(new Date(doc.ngay_ban_hanh), 'dd/MM/yyyy')}</span>
                )}
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                  doc.trang_thai === 'Còn hiệu lực' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {doc.trang_thai === 'Còn hiệu lực' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {doc.trang_thai}
                </div>
              </div>
            </div>

            <div className="shrink-0 mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-0">
              <Dialog>
                <DialogTrigger className="inline-flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition-colors">
                  <Eye className="w-4 h-4 mr-2" /> Xem tài liệu
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="truncate pr-8 text-primary">{doc.ten_van_ban}</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 w-full bg-gray-100 rounded-md overflow-hidden border mt-4 relative">
                    <iframe 
                      src={`${doc.file_url}#toolbar=0`} 
                      className="absolute inset-0 w-full h-full border-0"
                      title={doc.ten_van_ban}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
