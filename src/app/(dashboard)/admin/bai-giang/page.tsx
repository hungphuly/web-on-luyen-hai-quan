import { getDanhSachVideo } from '@/lib/modules/bai-giang/services/video.service';
import { getDanhSachLyThuyet } from '@/lib/modules/bai-giang/services/ly-thuyet.service';
import { getDanhSachChuyenDe } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { BaiGiangClient } from './BaiGiangClient';

export const metadata = {
  title: 'Quản lý Bài giảng',
};

export default async function BaiGiangAdminPage() {
  const videos = await getDanhSachVideo();
  const lyThuyets = await getDanhSachLyThuyet();
  const chuyenDeList = await getDanhSachChuyenDe();

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">Quản lý bài giảng</h1>
        <p className="text-sm text-muted-foreground mt-2">Thêm, sửa, xóa các video và tài liệu lý thuyết cho từng chuyên đề.</p>
      </div>

      <BaiGiangClient 
        videos={videos}
        lyThuyets={lyThuyets}
        chuyenDeList={chuyenDeList}
      />
    </div>
  );
}
