'use client';

import { useState, useTransition } from 'react';
import { createChuyenDe, updateChuyenDe, deleteChuyenDe } from './actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { DanhMucChuyenDe, ChuyenDeStats } from '@/lib/modules/bai-giang/types';

export function ChuyenDeClient({ chuyenDeList }: { chuyenDeList: ChuyenDeStats[] }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChuyenDeStats | null>(null);

  const handleOpenEdit = (item: ChuyenDeStats) => {
    setEditingItem(item);
    setOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      let res;
      if (editingItem) {
        res = await updateChuyenDe(editingItem.id, formData);
      } else {
        res = await createChuyenDe(formData);
      }
      
      if (res.error) {
        alert(res.error);
      } else {
        setOpen(false);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chuyên đề này?')) return;
    
    startTransition(async () => {
      const res = await deleteChuyenDe(id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900">Danh sách chuyên đề</h2>
        
        <Button onClick={handleOpenAdd} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Thêm chuyên đề
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Sửa chuyên đề' : 'Thêm chuyên đề mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="ten">Tên chuyên đề</Label>
                <Input id="ten" name="ten" defaultValue={editingItem?.ten || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mo_ta">Mô tả (Không bắt buộc)</Label>
                <Input id="mo_ta" name="mo_ta" defaultValue={editingItem?.mo_ta || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thu_tu">Thứ tự hiển thị</Label>
                <Input id="thu_tu" name="thu_tu" type="number" defaultValue={editingItem?.thu_tu || 0} required />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu thông tin
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Tên chuyên đề</th>
              <th className="px-6 py-4 font-semibold">Thứ tự</th>
              <th className="px-6 py-4 font-semibold">Thống kê</th>
              <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {chuyenDeList.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{item.ten}</div>
                  <div className="text-xs text-muted-foreground mt-1">Slug: {item.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                    {item.thu_tu}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  <div className="flex gap-3">
                    <span title="Video bài giảng">{item.video_count} video</span>
                    <span title="Lý thuyết">{item.ly_thuyet_count} lý thuyết</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenEdit(item)}
                      disabled={isPending}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {chuyenDeList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Chưa có chuyên đề nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
