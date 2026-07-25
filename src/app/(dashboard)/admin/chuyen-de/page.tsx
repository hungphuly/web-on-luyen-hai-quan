import { getDanhSachChuyenDe } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { ChuyenDeClient } from './ChuyenDeClient';

export const metadata = {
  title: 'Quản lý Chuyên đề',
};

export default async function ChuyenDeAdminPage() {
  const chuyenDeList = await getDanhSachChuyenDe();

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">Quản lý chuyên đề</h1>
        <p className="text-sm text-muted-foreground mt-2">Thêm, sửa, xóa các chuyên đề học tập trong hệ thống.</p>
      </div>

      <ChuyenDeClient chuyenDeList={chuyenDeList} />
    </div>
  );
}
