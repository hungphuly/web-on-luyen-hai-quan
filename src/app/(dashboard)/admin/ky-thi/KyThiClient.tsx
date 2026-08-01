'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, Users } from 'lucide-react';
import { KyThi } from '@/lib/modules/ky-thi/types';
import { DanhMucChuyenDe } from '@/lib/modules/bai-giang/types';
import { upsertKyThi, deleteKyThi } from '@/lib/modules/admin/actions/ky-thi.actions';
import Link from 'next/link';

interface Props {
  initialData: KyThi[];
  chuyenDeList: DanhMucChuyenDe[];
}

export function KyThiClient({ initialData, chuyenDeList }: Props) {
  const [data, setData] = useState<KyThi[]>(initialData);
  const [isPending, startTransition] = useTransition();
  
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KyThi | null>(null);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (item: KyThi) => {
    setEditingItem(item);
    setOpenModal(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await upsertKyThi(editingItem?.id || null, formData);
      if (res.error) {
        alert(res.error);
      } else {
        setOpenModal(false);
        window.location.reload();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kỳ thi này? Mọi kết quả thi sẽ bị xóa!')) return;
    
    startTransition(async () => {
      const res = await deleteKyThi(id);
      if (res.error) alert(res.error);
      else window.location.reload();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Kỳ thi thật</h1>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo kỳ thi
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Chưa có kỳ thi nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3">Tên kỳ thi</th>
                  <th className="px-6 py-3">Thời gian</th>
                  <th className="px-6 py-3">Số câu hỏi</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-primary">
                      {item.ten_ky_thi}
                    </td>
                    <td className="px-6 py-4">{item.thoi_gian_lam_bai} phút</td>
                    <td className="px-6 py-4">{item.so_luong_cau_hoi} câu</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${item.trang_thai === 'active' ? 'bg-green-100 text-green-700' : 
                          item.trang_thai === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {item.trang_thai === 'active' ? 'Đang mở' : item.trang_thai === 'draft' ? 'Nháp' : 'Đã đóng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/ky-thi/${item.id}/ket-qua`}>
                          <Button variant="outline" size="sm" title="Xem bảng điểm">
                            <Users className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)} disabled={isPending}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)} disabled={isPending}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Sửa kỳ thi' : 'Tạo kỳ thi mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="ten_ky_thi">Tên kỳ thi</Label>
              <Input id="ten_ky_thi" name="ten_ky_thi" defaultValue={editingItem?.ten_ky_thi} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mo_ta">Mô tả (Tùy chọn)</Label>
              <textarea 
                id="mo_ta" 
                name="mo_ta" 
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={editingItem?.mo_ta || ''} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thoi_gian_lam_bai">Thời gian làm bài (phút)</Label>
                <Input type="number" id="thoi_gian_lam_bai" name="thoi_gian_lam_bai" defaultValue={editingItem?.thoi_gian_lam_bai || 60} required min="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="so_luong_cau_hoi">Số lượng câu hỏi lấy ra thi</Label>
                <Input type="number" id="so_luong_cau_hoi" name="so_luong_cau_hoi" defaultValue={editingItem?.so_luong_cau_hoi || 30} required min="1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phạm vi chuyên đề (Lấy câu hỏi từ đâu?)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 p-4 border rounded-md max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="cau_hinh_chuyen_de" value="all" defaultChecked={!editingItem?.cau_hinh_chuyen_de} />
                  <span className="font-bold text-primary">Tất cả chuyên đề</span>
                </label>
                {chuyenDeList.map(cd => (
                  <label key={cd.id} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      name="cau_hinh_chuyen_de" 
                      value={cd.id} 
                      defaultChecked={editingItem?.cau_hinh_chuyen_de?.includes(cd.id)} 
                    />
                    {cd.ten}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Nếu chọn "Tất cả chuyên đề", hệ thống sẽ bỏ qua các chuyên đề cụ thể được chọn.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trang_thai">Trạng thái</Label>
              <select 
                id="trang_thai" 
                name="trang_thai" 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={editingItem?.trang_thai || 'draft'} 
                required
              >
                <option value="draft">Nháp (Chỉ Admin xem được)</option>
                <option value="active">Đang mở (Cho phép thi)</option>
                <option value="closed">Đã đóng (Không cho thi nữa)</option>
              </select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Hủy</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu kỳ thi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
