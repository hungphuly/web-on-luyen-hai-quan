'use client';

import { useState, useTransition } from 'react';
import { createVideo, updateVideo, deleteVideo, createLyThuyet, updateLyThuyet, deleteLyThuyet } from './actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Plus, Loader2, Video, FileText } from 'lucide-react';
import { BaiGiangVideo, BaiGiangLyThuyet, DanhMucChuyenDe } from '@/lib/modules/bai-giang/types';

export function BaiGiangClient({ 
  videos, 
  lyThuyets, 
  chuyenDeList 
}: { 
  videos: BaiGiangVideo[], 
  lyThuyets: BaiGiangLyThuyet[],
  chuyenDeList: DanhMucChuyenDe[] 
}) {
  const [activeTab, setActiveTab] = useState<'video' | 'ly-thuyet'>('video');
  const [isPending, startTransition] = useTransition();
  
  // Video state
  const [openVideo, setOpenVideo] = useState(false);
  const [editingVideo, setEditingVideo] = useState<BaiGiangVideo | null>(null);

  // Ly Thuyet state
  const [openLyThuyet, setOpenLyThuyet] = useState(false);
  const [editingLyThuyet, setEditingLyThuyet] = useState<BaiGiangLyThuyet | null>(null);

  // --- Handlers for Video ---
  const handleOpenAddVideo = () => { setEditingVideo(null); setOpenVideo(true); };
  const handleOpenEditVideo = (item: BaiGiangVideo) => { setEditingVideo(item); setOpenVideo(true); };
  
  const handleSubmitVideo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editingVideo ? await updateVideo(editingVideo.id, formData) : await createVideo(formData);
      if (res.error) alert(res.error);
      else setOpenVideo(false);
    });
  };

  const handleDeleteVideo = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa video này?')) return;
    startTransition(async () => {
      const res = await deleteVideo(id);
      if (res.error) alert(res.error);
    });
  };

  // --- Handlers for Ly Thuyet ---
  const handleOpenAddLyThuyet = () => { setEditingLyThuyet(null); setOpenLyThuyet(true); };
  const handleOpenEditLyThuyet = (item: BaiGiangLyThuyet) => { setEditingLyThuyet(item); setOpenLyThuyet(true); };

  const handleSubmitLyThuyet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editingLyThuyet ? await updateLyThuyet(editingLyThuyet.id, formData) : await createLyThuyet(formData);
      if (res.error) alert(res.error);
      else setOpenLyThuyet(false);
    });
  };

  const handleDeleteLyThuyet = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài lý thuyết này?')) return;
    startTransition(async () => {
      const res = await deleteLyThuyet(id);
      if (res.error) alert(res.error);
    });
  };

  const getTenChuyenDe = (id: string) => chuyenDeList.find(c => c.id === id)?.ten || 'N/A';

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'video' 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('video')}
        >
          <Video className="w-4 h-4 mr-2" />
          Bài giảng Video
        </button>
        <button
          className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'ly-thuyet' 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('ly-thuyet')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Bài giảng Lý thuyết
        </button>
      </div>

      {/* VIDEO TAB CONTENT */}
      {activeTab === 'video' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900">Danh sách Video</h2>
            
            <Button onClick={handleOpenAddVideo} className="bg-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Thêm Video
            </Button>
            <Dialog open={openVideo} onOpenChange={setOpenVideo}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingVideo ? 'Sửa Video' : 'Thêm Video mới'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitVideo} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="chuyen_de_id">Chuyên đề</Label>
                    <select 
                      id="chuyen_de_id" 
                      name="chuyen_de_id" 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={editingVideo?.chuyen_de_id || ''} 
                      required
                    >
                      <option value="" disabled>Chọn chuyên đề</option>
                      {chuyenDeList.map(cd => (
                        <option key={cd.id} value={cd.id}>{cd.ten}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tieu_de">Tiêu đề Video</Label>
                    <Input id="tieu_de" name="tieu_de" defaultValue={editingVideo?.tieu_de || ''} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube_id">YouTube ID</Label>
                    <Input id="youtube_id" name="youtube_id" placeholder="VD: dQw4w9WgXcQ" defaultValue={editingVideo?.youtube_id || ''} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mo_ta">Mô tả</Label>
                    <Input id="mo_ta" name="mo_ta" defaultValue={editingVideo?.mo_ta || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thu_tu">Thứ tự hiển thị</Label>
                    <Input id="thu_tu" name="thu_tu" type="number" defaultValue={editingVideo?.thu_tu || 0} required />
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
                  <th className="px-6 py-4 font-semibold">Chuyên đề</th>
                  <th className="px-6 py-4 font-semibold">Tiêu đề Video</th>
                  <th className="px-6 py-4 font-semibold">YouTube ID</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {videos.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                        {getTenChuyenDe(item.chuyen_de_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.tieu_de}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.youtube_id}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditVideo(item)} disabled={isPending}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteVideo(item.id)} disabled={isPending}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {videos.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa có video nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LY THUYET TAB CONTENT */}
      {activeTab === 'ly-thuyet' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900">Danh sách Lý thuyết</h2>
            
            <Button onClick={handleOpenAddLyThuyet} className="bg-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Thêm Lý thuyết
            </Button>
            <Dialog open={openLyThuyet} onOpenChange={setOpenLyThuyet}>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editingLyThuyet ? 'Sửa Lý thuyết' : 'Thêm Lý thuyết mới'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitLyThuyet} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="chuyen_de_id">Chuyên đề</Label>
                      <select 
                        id="chuyen_de_id" 
                        name="chuyen_de_id" 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={editingLyThuyet?.chuyen_de_id || ''} 
                        required
                      >
                        <option value="" disabled>Chọn chuyên đề</option>
                        {chuyenDeList.map(cd => (
                          <option key={cd.id} value={cd.id}>{cd.ten}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thu_tu">Thứ tự hiển thị</Label>
                      <Input id="thu_tu" name="thu_tu" type="number" defaultValue={editingLyThuyet?.thu_tu || 0} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tieu_de">Tiêu đề bài học</Label>
                    <Input id="tieu_de" name="tieu_de" defaultValue={editingLyThuyet?.tieu_de || ''} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hinh_anh_url">URL Ảnh minh họa (Tùy chọn)</Label>
                    <Input id="hinh_anh_url" name="hinh_anh_url" defaultValue={editingLyThuyet?.hinh_anh_url || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file_dinh_kem">Tài liệu đính kèm (chỉ nhận PDF)</Label>
                    <Input 
                      id="file_dinh_kem" 
                      name="file_dinh_kem" 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                          alert('Vui lòng chuyển sang PDF trước khi upload!');
                          e.target.value = '';
                        }
                      }}
                    />
                    {(editingLyThuyet as any)?.file_dinh_kem_url && (
                      <p className="text-xs text-blue-600 mt-1">
                        * Bài giảng này đã có file đính kèm. Upload file mới sẽ ghi đè file cũ.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noi_dung_markdown">Nội dung (Markdown)</Label>
                    <textarea 
                      id="noi_dung_markdown" 
                      name="noi_dung_markdown" 
                      className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={editingLyThuyet?.noi_dung_markdown || ''} 
                      required 
                    />
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
                  <th className="px-6 py-4 font-semibold">Chuyên đề</th>
                  <th className="px-6 py-4 font-semibold">Tiêu đề bài học</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lyThuyets.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                        {getTenChuyenDe(item.chuyen_de_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.tieu_de}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditLyThuyet(item)} disabled={isPending}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteLyThuyet(item.id)} disabled={isPending}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {lyThuyets.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Chưa có bài lý thuyết nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
