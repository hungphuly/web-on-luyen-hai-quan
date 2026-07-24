import { getDanhSachTaiLieu } from '@/lib/modules/tai-lieu/services/tai-lieu.service';
import { TraCuuApp } from './TraCuuApp';

export const metadata = {
  title: 'Tra cứu pháp luật - Ôn Luyện Hải Quan',
};

export default async function TraCuuPage() {
  // Lấy danh sách mặc định ban đầu để SSR
  const initialData = await getDanhSachTaiLieu({ trangThai: 'Tất cả' });

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">Tra cứu pháp luật</h1>
        <p className="text-sm text-muted-foreground mt-2">Tìm kiếm và tra cứu các văn bản quy phạm pháp luật liên quan đến lĩnh vực Hải quan.</p>
      </div>

      <TraCuuApp initialData={initialData} />
    </div>
  );
}
