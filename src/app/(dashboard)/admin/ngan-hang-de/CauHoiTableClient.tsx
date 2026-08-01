'use client';

import { useState, useTransition } from 'react';
import { updateCauHoi, deleteCauHoi } from './actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { CauHoiAdmin } from '@/lib/modules/ngan-hang-de/types';
import { DanhMucChuyenDe } from '@/lib/modules/bai-giang/types';

export function CauHoiTableClient({ 
  cauHoiList, 
  chuyenDeList 
}: { 
  cauHoiList: CauHoiAdmin[], 
  chuyenDeList: DanhMucChuyenDe[] 
}) {
  const [isPending, startTransition] = useTransition();
  const [openEdit, setOpenEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<CauHoiAdmin | null>(null);

  const handleOpenEdit = (item: CauHoiAdmin) => {
    setEditingItem(item);
    setOpenEdit(true);
  };

  const handleSubmitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await updateCauHoi(editingItem.id, formData);
      if (res.error) {
        alert(res.error);
      } else {
        setOpenEdit(false);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    
    startTransition(async () => {
      const res = await deleteCauHoi(id);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">Danh sách câu hỏi hiện tại</h2>
      </div>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa câu hỏi</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleSubmitEdit} className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chuyen_de_id">Chuyên đề</Label>
                  <select 
                    id="chuyen_de_id" 
                    name="chuyen_de_id" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    defaultValue={editingItem.chuyen_de_id} 
                    required
                  >
                    {chuyenDeList.map(cd => (
                      <option key={cd.id} value={cd.id}>{cd.ten}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="do_kho">Độ khó</Label>
                  <select 
                    id="do_kho" 
                    name="do_kho" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    defaultValue={editingItem.do_kho} 
                    required
                  >
                    <option value={1}>Dễ (1)</option>
                    <option value={2}>Trung bình (2)</option>
                    <option value={3}>Khó (3)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Phân loại</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" name="phan_loai" value="1" defaultChecked={editingItem.phan_loai?.includes(1)} /> Ôn luyện
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" name="phan_loai" value="2" defaultChecked={editingItem.phan_loai?.includes(2)} /> Thi thử
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" name="phan_loai" value="3" defaultChecked={editingItem.phan_loai?.includes(3)} /> Thi thật
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="noi_dung">Nội dung câu hỏi</Label>
                <textarea 
                  id="noi_dung" 
                  name="noi_dung" 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editingItem.noi_dung} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lua_chon_a">Lựa chọn A</Label>
                  <Input id="lua_chon_a" name="lua_chon_a" defaultValue={editingItem.cac_lua_chon.a} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lua_chon_b">Lựa chọn B</Label>
                  <Input id="lua_chon_b" name="lua_chon_b" defaultValue={editingItem.cac_lua_chon.b} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lua_chon_c">Lựa chọn C</Label>
                  <Input id="lua_chon_c" name="lua_chon_c" defaultValue={editingItem.cac_lua_chon.c} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lua_chon_d">Lựa chọn D</Label>
                  <Input id="lua_chon_d" name="lua_chon_d" defaultValue={editingItem.cac_lua_chon.d} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dap_an_dung">Đáp án đúng</Label>
                <select 
                  id="dap_an_dung" 
                  name="dap_an_dung" 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editingItem.dap_an_dung} 
                  required
                >
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="can_cu_phap_ly">Căn cứ pháp lý</Label>
                <textarea 
                  id="can_cu_phap_ly" 
                  name="can_cu_phap_ly" 
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editingItem.can_cu_phap_ly} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="giai_thich_chi_tiet">Giải thích chi tiết (Tùy chọn)</Label>
                <textarea 
                  id="giai_thich_chi_tiet" 
                  name="giai_thich_chi_tiet" 
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editingItem.giai_thich_chi_tiet || ''} 
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Hủy</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {cauHoiList.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Chưa có câu hỏi nào. Hãy import từ file Excel.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="px-6 py-3">Chuyên đề</th>
                <th className="px-6 py-3 min-w-[300px]">Nội dung</th>
                <th className="px-6 py-3">Độ khó</th>
                <th className="px-6 py-3">Phân loại</th>
                <th className="px-6 py-3">Căn cứ pháp lý</th>
                <th className="px-6 py-3 text-center">Đáp án</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cauHoiList.map((ch) => (
                <tr key={ch.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-primary">
                    {ch.chuyen_de?.ten}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 line-clamp-2">{ch.noi_dung}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${ch.do_kho === 1 ? 'bg-green-100 text-green-700' : 
                        ch.do_kho === 2 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'}`}
                    >
                      {ch.do_kho === 1 ? 'Dễ' : ch.do_kho === 2 ? 'TB' : 'Khó'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {ch.phan_loai?.includes(1) && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Ôn luyện</span>}
                      {ch.phan_loai?.includes(2) && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Thi thử</span>}
                      {ch.phan_loai?.includes(3) && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Thi thật</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs line-clamp-2 max-w-[200px]">
                    {ch.can_cu_phap_ly}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-lg text-primary uppercase">{ch.dap_an_dung}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(ch)} disabled={isPending}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(ch.id)} disabled={isPending}>
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
  );
}
