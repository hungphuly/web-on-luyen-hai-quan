import { getDanhSachCauHoiAdmin } from '@/lib/modules/ngan-hang-de/services/ngan-hang-de.service';
import { getDanhSachChuyenDe } from '@/lib/modules/bai-giang/services/chuyen-de.service';
import { ImportForm } from './ImportForm';

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

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Danh sách câu hỏi hiện tại</h2>
        </div>
        
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
                  <th className="px-6 py-3">Căn cứ pháp lý</th>
                  <th className="px-6 py-3 text-center">Đáp án</th>
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
                        ${ch.do_kho === 'de' ? 'bg-green-100 text-green-700' : 
                          ch.do_kho === 'trung_binh' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'}`}
                      >
                        {ch.do_kho}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs line-clamp-2 max-w-[200px]">
                      {ch.can_cu_phap_ly}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-lg text-primary uppercase">{ch.dap_an_dung}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
