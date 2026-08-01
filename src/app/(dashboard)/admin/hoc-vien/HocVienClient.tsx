'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDanhSachHocVien, getAllHocVienForExport, HocVienData } from '@/lib/modules/admin/actions/hoc-vien.actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export function HocVienClient() {
  const [data, setData] = useState<HocVienData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [isNew, setIsNew] = useState<'all' | 'new' | 'old'>('all');
  const [isDonated, setIsDonated] = useState<'all' | 'donated' | 'not_donated'>('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDanhSachHocVien({
        page,
        limit,
        search,
        isNew,
        isDonated
      });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isNew, isDonated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [search, isNew, isDonated]);

  const totalPages = Math.ceil(total / limit);

  const handleExport = async () => {
    setExporting(true);
    try {
      const allData = await getAllHocVienForExport({
        search,
        isNew,
        isDonated
      });

      const dataToExport = allData.map((s, idx) => ({
        'STT': idx + 1,
        'Họ tên': s.ho_ten || '',
        'Email': s.email || '',
        'Phân loại': s.phan_loai,
        'Loại tài khoản': s.loai_tai_khoan,
        'VIP hết hạn': s.vip_het_han ? new Date(s.vip_het_han).toLocaleDateString('vi-VN') : '',
        'Đã Donate': s.tong_donate > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.tong_donate) : 'Chưa',
        'Ngày đăng ký': new Date(s.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hoc_Vien");
      
      const wscols = [
        { wch: 5 }, // STT
        { wch: 25 }, // Họ tên
        { wch: 30 }, // Email
        { wch: 15 }, // Phân loại
        { wch: 15 }, // Loại tài khoản
        { wch: 15 }, // VIP hết hạn
        { wch: 20 }, // Đã Donate
        { wch: 20 }, // Ngày đăng ký
      ];
      worksheet['!cols'] = wscols;

      XLSX.writeFile(workbook, `Danh_Sach_Hoc_Vien_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xuất Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Danh sách Học viên</h1>
        <Button 
          onClick={handleExport} 
          disabled={exporting || loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Xuất Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Tìm kiếm theo Tên hoặc Email..." 
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="h-10 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
          value={isNew}
          onChange={(e) => setIsNew(e.target.value as any)}
        >
          <option value="all">Tất cả Phân loại</option>
          <option value="new">Học viên Mới (30 ngày)</option>
          <option value="old">Học viên Cũ</option>
        </select>
        <select 
          className="h-10 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
          value={isDonated}
          onChange={(e) => setIsDonated(e.target.value as any)}
        >
          <option value="all">Tất cả Trạng thái Donate</option>
          <option value="donated">Đã Donate</option>
          <option value="not_donated">Chưa Donate</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">STT</th>
                <th className="px-6 py-4 font-semibold">Học viên</th>
                <th className="px-6 py-4 font-semibold">Ngày đăng ký</th>
                <th className="px-6 py-4 font-semibold">Phân loại</th>
                <th className="px-6 py-4 font-semibold">Donate</th>
                <th className="px-6 py-4 font-semibold">Loại tài khoản</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy học viên nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                data.map((hv, idx) => (
                  <tr key={hv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{hv.ho_ten || 'N/A'}</div>
                      <div className="text-xs text-gray-500 mt-1">{hv.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(hv.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        hv.phan_loai === 'Mới' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {hv.phan_loai}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hv.tong_donate > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(hv.tong_donate)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Chưa</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        hv.loai_tai_khoan === 'admin' ? 'bg-red-100 text-red-700' : 
                        hv.loai_tai_khoan === 'vip' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {hv.loai_tai_khoan.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="border-t border-gray-100 p-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              Hiển thị <b>{(page - 1) * limit + 1}</b> - <b>{Math.min(page * limit, total)}</b> trong số <b>{total}</b> học viên
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Trước
              </Button>
              <div className="font-medium px-2">Trang {page} / {totalPages}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Sau
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
