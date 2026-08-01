'use client';

import { Users, FileText, CheckCircle, MessageSquare, ArrowRight, Video, BookOpen, Layers, Activity } from 'lucide-react';
import Link from 'next/link';

export function BaoCaoDashboardClient({ 
  tongQuan, 
  chuyenDeStats, 
  kyThiStats 
}: { 
  tongQuan: any, 
  chuyenDeStats: any[], 
  kyThiStats: any[] 
}) {
  const stats = [
    { label: 'Tổng Học viên', value: tongQuan.tongHocVien, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Học viên Hoạt động (7 ngày)', value: tongQuan.hocVienHoatDong, icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Tổng Câu hỏi', value: tongQuan.tongCauHoi, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Tổng Video', value: tongQuan.tongVideo, icon: Video, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Bài Lý thuyết', value: tongQuan.tongLyThuyet, icon: BookOpen, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Tổng Flashcard', value: tongQuan.tongFlashcard, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-8">
      {/* KHỐI 1: TỔNG QUAN */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-gray-900">Tổng quan Hệ thống</h2>
          <Link href="/admin/hoc-vien" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1 transition-colors">
            Xem danh sách học viên đầy đủ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-xl border p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</h3>
                  <p className="text-xs font-medium text-gray-500 line-clamp-1" title={stat.label}>{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KHỐI 2: CHUYÊN ĐỀ */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Thống kê Chuyên đề (Điểm Yếu)</h2>
          <p className="text-sm text-gray-500">Được sắp xếp theo tỷ lệ làm bài đúng từ thấp lên cao.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên Chuyên đề</th>
                <th className="px-6 py-4 font-semibold text-center">Số câu hỏi</th>
                <th className="px-6 py-4 font-semibold text-center">Tỷ lệ đúng (Ôn luyện)</th>
                <th className="px-6 py-4 font-semibold text-center">Tỷ lệ đúng (Thi thử)</th>
                <th className="px-6 py-4 font-semibold text-center">% Hoàn thành Học liệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chuyenDeStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu chuyên đề.</td>
                </tr>
              ) : (
                chuyenDeStats.map(cd => (
                  <tr key={cd.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{cd.ten}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{cd.soCauHoi}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${cd.tyLeOnLuyen < 50 ? 'text-red-600' : 'text-gray-900'}`}>
                        {cd.tyLeOnLuyen}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${cd.tyLeThiThu < 50 ? 'text-red-600' : 'text-gray-900'}`}>
                        {cd.tyLeThiThu}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold text-blue-600`}>
                        {cd.tyLeHocLieu}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KHỐI 3: KỲ THI THẬT */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Kết quả Kỳ thi thật đã tổ chức</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên Kỳ thi</th>
                <th className="px-6 py-4 font-semibold text-center">Số học viên thi</th>
                <th className="px-6 py-4 font-semibold text-center">Điểm Trung bình</th>
                <th className="px-6 py-4 font-semibold text-center">Điểm Cao nhất</th>
                <th className="px-6 py-4 font-semibold text-center">Điểm Thấp nhất</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kyThiStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu kỳ thi.</td>
                </tr>
              ) : (
                kyThiStats.map(kt => (
                  <tr key={kt.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{kt.ten_ky_thi}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{kt.soHocVien}</td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600">{kt.diemTrungBinh}</td>
                    <td className="px-6 py-4 text-center font-semibold text-green-600">{kt.diemCaoNhat}</td>
                    <td className="px-6 py-4 text-center font-semibold text-red-600">{kt.diemThapNhat}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/ky-thi/${kt.id}/ket-qua`}>
                        <span className="text-primary hover:underline font-medium cursor-pointer">Chi tiết</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
