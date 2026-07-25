import { getDanhSachCauHoiAdmin } from '@/lib/modules/ngan-hang-de/services/ngan-hang-de.service';
import { getDanhSachChuyenDe } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { ImportForm } from './ImportForm';
import { CauHoiTableClient } from './CauHoiTableClient';

export const metadata = {
  title: 'Quản lý Ngân hàng đề',
};

export default async function NganHangDeAdminPage() {
  const cauHoiList = await getDanhSachCauHoiAdmin();
  const chuyenDeList = await getDanhSachChuyenDe();

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">Ngân hàng câu hỏi</h1>
        <p className="text-sm text-muted-foreground mt-2">Quản lý và import dữ liệu câu hỏi trắc nghiệm vào hệ thống.</p>
      </div>

      <ImportForm chuyenDeList={chuyenDeList} />

      <CauHoiTableClient cauHoiList={cauHoiList} chuyenDeList={chuyenDeList} />
    </div>
  );
}
