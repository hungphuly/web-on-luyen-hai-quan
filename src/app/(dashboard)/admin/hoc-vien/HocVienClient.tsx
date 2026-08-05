'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDanhSachHocVien, getAllHocVienForExport, HocVienData, getHocVienReport, adminDoiMatKhauHocVien } from '@/lib/modules/admin/actions/hoc-vien.actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, ChevronLeft, ChevronRight, Loader2, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, BookOpen, Target, FileSignature, Trophy, Calendar, Clock, Copy, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function HocVienClient() {
  const [data, setData] = useState<HocVienData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [isNew, setIsNew] = useState<'all' | 'new' | 'old'>('all');
  const [isDonated, setIsDonated] = useState<'all' | 'donated' | 'not_donated'>('all');
  const [isStudying, setIsStudying] = useState<'all' | 'studying' | 'lazy'>('all');
  
  // Modal Report state
  const [reportUser, setReportUser] = useState<HocVienData | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Modal Reset Password state
  const [resetUser, setResetUser] = useState<HocVienData | null>(null);
  const [newPassword, setNewPassword] = useState('123456');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
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
        isDonated,
        isStudying
      });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isNew, isDonated, isStudying]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [search, isNew, isDonated, isStudying]);

  const totalPages = Math.ceil(total / limit);

  const handleOpenReport = async (user: HocVienData) => {
    setReportUser(user);
    setReportLoading(true);
    try {
      const data = await getHocVienReport(user.id);
      setReportData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleOpenReset = (user: HocVienData) => {
    setResetUser(user);
    setNewPassword('123456');
    setShowNewPassword(false);
    setResetSuccess(false);
    setResetError(null);
    setCopied(false);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    if (newPassword.length < 6) {
      setResetError('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      await adminDoiMatKhauHocVien(resetUser.id, newPassword);
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa học';
    const diffHours = (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return 'Hôm nay';
    if (diffHours < 48) return 'Hôm qua';
    return `${Math.floor(diffHours / 24)} ngày trước`;
  };

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
        <select 
          className="h-10 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
          value={isStudying}
          onChange={(e) => setIsStudying(e.target.value as any)}
        >
          <option value="all">Tất cả Trạng thái Học</option>
          <option value="studying">Chăm học (7 ngày)</option>
          <option value="lazy">Bỏ bê (&gt; 7 ngày)</option>
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
                <th className="px-6 py-4 font-semibold">Loại tài khoản</th>
                <th className="px-6 py-4 font-semibold">H.động gần nhất</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
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
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        hv.loai_tai_khoan === 'admin' ? 'bg-red-100 text-red-700' : 
                        hv.loai_tai_khoan === 'vip' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {hv.loai_tai_khoan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(hv.last_activity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => handleOpenReport(hv)}
                        >
                          Xem tiến độ
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                          title="Đổi mật khẩu cho học viên"
                          onClick={() => handleOpenReset(hv)}
                        >
                          <KeyRound className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Đổi MK</span>
                        </Button>
                      </div>
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

      <Dialog open={!!reportUser} onOpenChange={(open) => !open && setReportUser(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Báo cáo tiến độ: <span className="text-primary">{reportUser?.ho_ten || reportUser?.email}</span>
            </DialogTitle>
            <DialogDescription>
              Theo dõi chi tiết mức độ chăm chỉ và kết quả học tập của học viên này trên toàn hệ thống.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                Đang tổng hợp dữ liệu học tập...
              </div>
            ) : reportData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-lg mb-2">
                    <BookOpen className="w-5 h-5" /> 1. Hoàn thành Học liệu
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <span className="text-gray-600 font-medium">Video Bài giảng</span>
                    <span className="font-bold text-xl">{reportData.hocLieu.video} <span className="text-sm font-normal text-gray-400">bài</span></span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <span className="text-gray-600 font-medium">Lý thuyết</span>
                    <span className="font-bold text-xl">{reportData.hocLieu.lyThuyet} <span className="text-sm font-normal text-gray-400">bài</span></span>
                  </div>
                </div>

                <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-lg mb-2">
                    <Target className="w-5 h-5" /> 2. Kết quả Ôn luyện
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <span className="text-gray-600 font-medium">Tổng số câu đã làm</span>
                    <span className="font-bold text-xl">{reportData.onLuyen.daLam}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <span className="text-gray-600 font-medium">Tỷ lệ trả lời đúng</span>
                    <span className={`font-bold text-xl ${reportData.onLuyen.tyLe < 50 ? 'text-red-600' : 'text-green-600'}`}>
                      {reportData.onLuyen.tyLe}%
                    </span>
                  </div>
                </div>

                <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-orange-800 font-bold text-lg mb-2">
                    <FileSignature className="w-5 h-5" /> 3. Tham gia Thi thử
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <span className="text-gray-600 font-medium">Số lượt thi</span>
                    <span className="font-bold text-xl">{reportData.thiThu.luotThi}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <span className="text-gray-600 font-medium">Điểm số trung bình</span>
                    <span className="font-bold text-xl text-orange-600">{reportData.thiThu.diemTrungBinh}</span>
                  </div>
                </div>

                <div className="bg-green-50/50 p-5 rounded-xl border border-green-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-green-800 font-bold text-lg mb-2">
                    <Trophy className="w-5 h-5" /> 4. Kết quả Thi thật
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <span className="text-gray-600 font-medium">Số lượt thi</span>
                    <span className="font-bold text-xl">{reportData.thiThat.luotThi}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <span className="text-gray-600 font-medium">Điểm số trung bình</span>
                    <span className="font-bold text-xl text-green-600">{reportData.thiThat.diemTrungBinh}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Đổi mật khẩu học viên */}
      <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#1B4D3E]">
              <KeyRound className="w-5 h-5 text-amber-600" />
              Đổi mật khẩu học viên
            </DialogTitle>
            <DialogDescription>
              Đặt trực tiếp mật khẩu mới cho học viên mà không cần thông qua email.
            </DialogDescription>
          </DialogHeader>

          {resetUser && (
            <div className="py-2 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border text-xs text-gray-600 space-y-1">
                <div><b>Học viên:</b> {resetUser.ho_ten || 'Chưa cập nhật tên'}</div>
                <div><b>Email:</b> <span className="font-mono text-gray-800">{resetUser.email}</span></div>
              </div>

              {resetSuccess ? (
                <div className="rounded-xl bg-green-50 p-4 border border-green-200 text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-900">
                    Đã đổi mật khẩu thành công!
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200 text-xs flex items-center justify-between">
                    <span className="text-gray-500">Mật khẩu mới:</span>
                    <span className="font-mono font-bold text-base text-gray-900">{newPassword}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCopyPassword}
                      className="h-7 px-2 text-xs text-primary"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copied ? 'Đã sao chép' : 'Sao chép'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Bạn có thể sao chép mật khẩu này gửi cho học viên để họ đăng nhập ngay.
                  </p>
                  <Button 
                    className="w-full bg-[#1B4D3E] hover:bg-[#153e32] text-white" 
                    onClick={() => setResetUser(null)}
                  >
                    Hoàn tất
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Mật khẩu mới</label>
                    <div className="relative">
                      <Input 
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        minLength={6}
                        required
                        className="pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => setNewPassword('123456')}
                      >
                        Đặt 123456
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={generateRandomPassword}
                      >
                        Tạo ngẫu nhiên
                      </Button>
                    </div>
                  </div>

                  {resetError && (
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setResetUser(null)}
                      disabled={resetLoading}
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#1B4D3E] hover:bg-[#153e32] text-white"
                      disabled={resetLoading}
                    >
                      {resetLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                      Lưu mật khẩu
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
