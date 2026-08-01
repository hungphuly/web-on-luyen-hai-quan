'use client';

import { KyThi, KyThiPhienLamBai } from '@/lib/modules/ky-thi/types';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  kyThi: KyThi;
  sessions: any[];
}

export function KetQuaClient({ kyThi, sessions }: Props) {

  const handleExport = () => {
    // Generate CSV
    let csv = 'STT,Họ tên,Email,Số điện thoại,Trạng thái,Bắt đầu,Kết thúc,Điểm số\n';
    
    sessions.forEach((s, idx) => {
      const hoTen = s.hoc_vien?.ho_ten || '';
      const email = s.hoc_vien?.email || '';
      const sdt = s.hoc_vien?.so_dien_thoai || '';
      const trangThai = s.trang_thai === 'da_nop' ? 'Đã nộp' : 'Đang thi';
      const batDau = new Date(s.bat_dau_luc).toLocaleString('vi-VN');
      const ketThuc = s.ket_thuc_luc ? new Date(s.ket_thuc_luc).toLocaleString('vi-VN') : '';
      const diem = s.diem_so !== null ? s.diem_so : '';
      
      csv += `${idx + 1},"${hoTen}","${email}","${sdt}","${trangThai}","${batDau}","${ketThuc}","${diem}"\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Diem_${kyThi.ten_ky_thi.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/ky-thi">
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Quay lại</Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Bảng điểm: {kyThi.ten_ky_thi}</h1>
        <div className="flex-1"></div>
        <Button onClick={handleExport} variant="default">
          <Download className="w-4 h-4 mr-2" />
          Xuất Excel / CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Chưa có học viên nào tham gia kỳ thi này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3">STT</th>
                  <th className="px-6 py-3">Học viên</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Thời gian thi</th>
                  <th className="px-6 py-3 text-right">Điểm số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.map((s, idx) => {
                  const isCompleted = s.trang_thai === 'da_nop';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{s.hoc_vien?.ho_ten || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{s.hoc_vien?.email}</div>
                        <div className="text-xs text-gray-500">{s.hoc_vien?.so_dien_thoai}</div>
                      </td>
                      <td className="px-6 py-4">
                        {isCompleted ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                            <CheckCircle className="w-3 h-3" /> Đã nộp bài
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3 animate-pulse" /> Đang thi
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        <div>Bắt đầu: {new Date(s.bat_dau_luc).toLocaleString('vi-VN')}</div>
                        {s.ket_thuc_luc && <div>Kết thúc: {new Date(s.ket_thuc_luc).toLocaleString('vi-VN')}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isCompleted ? (
                          <span className="text-lg font-bold text-primary">{s.diem_so}</span>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
