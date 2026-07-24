'use client'

import { useState, useEffect, useTransition } from 'react';
import { getDanhSachTaiLieu } from '@/lib/modules/tai-lieu/services/tai-lieu.service';
import { updateTaiLieu } from './actions';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';

export function AdminTaiLieuList() {
  const [data, setData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    const list = await getDanhSachTaiLieu();
    setData(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        await updateTaiLieu(id, {
          trang_thai: formData.get('trang_thai') as string,
          ngay_het_hieu_luc: formData.get('ngay_het_hieu_luc') as string || null,
        });
        setEditingId(null);
        await loadData();
      } catch (error: any) {
        alert(error.message || 'Lỗi cập nhật');
      }
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Danh sách văn bản đã tải lên</h2>
      
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Tên văn bản / Số hiệu</th>
              <th className="px-4 py-3 font-medium text-center">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-center">Ngày hết hiệu lực</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(doc => {
              const isEditing = editingId === doc.id;
              
              if (isEditing) {
                return (
                  <tr key={doc.id} className="bg-blue-50/30">
                    <td colSpan={4} className="p-0">
                      <form onSubmit={(e) => handleUpdate(e, doc.id)} className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                          <p className="font-bold text-gray-900 line-clamp-1">{doc.ten_van_ban}</p>
                          <p className="text-gray-500 text-xs">{doc.so_hieu}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                          <select name="trang_thai" defaultValue={doc.trang_thai} className="w-full border p-2 rounded-lg text-sm bg-white">
                            <option value="Còn hiệu lực">Còn hiệu lực</option>
                            <option value="Hết hiệu lực">Hết hiệu lực</option>
                            <option value="Sắp có hiệu lực">Sắp có hiệu lực</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Ngày hết HL</label>
                          <input 
                            type="date" 
                            name="ngay_het_hieu_luc" 
                            defaultValue={doc.ngay_het_hieu_luc || ''} 
                            className="w-full border p-2 rounded-lg text-sm bg-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)} disabled={isPending}>
                            Hủy
                          </Button>
                          <Button type="submit" size="sm" disabled={isPending}>
                            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Lưu
                          </Button>
                        </div>
                      </form>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={doc.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">{doc.ten_van_ban}</p>
                    <p className="text-gray-500">{doc.so_hieu}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      doc.trang_thai === 'Còn hiệu lực' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {doc.trang_thai}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {doc.ngay_het_hieu_luc ? format(new Date(doc.ngay_het_hieu_luc), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => setEditingId(doc.id)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  Chưa có văn bản nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
