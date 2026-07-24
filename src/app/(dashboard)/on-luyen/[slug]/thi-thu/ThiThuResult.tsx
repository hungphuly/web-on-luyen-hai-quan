import { KetQuaThiThu } from '@/lib/modules/thi-thu/types';
import { CheckCircle2, XCircle, AlertCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

export function ThiThuResult({ ketQua, chuyenDeTen }: { ketQua: KetQuaThiThu, chuyenDeTen: string }) {
  const tongSoCau = ketQua.chi_tiet_bai_lam.length;
  // diem_so dạng text "X/Y" hoặc lưu kiểu số X
  const soCauDung = ketQua.chi_tiet_bai_lam.filter(c => c.dung).length;
  const tyLe = Math.round((soCauDung / tongSoCau) * 100) || 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header kết quả */}
      <div className="bg-white rounded-2xl border p-8 text-center space-y-4 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Kết quả thi thử: {chuyenDeTen}</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
          <div className="text-center">
            <div className="text-5xl font-black text-primary mb-2">{soCauDung}/{tongSoCau}</div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Số câu đúng</div>
          </div>
          
          <div className="w-px h-16 bg-gray-200 hidden md:block"></div>
          
          <div className="text-center">
            <div className={`text-5xl font-black mb-2 ${tyLe >= 50 ? 'text-green-500' : 'text-orange-500'}`}>
              {tyLe}%
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tỷ lệ chính xác</div>
          </div>
          
          <div className="w-px h-16 bg-gray-200 hidden md:block"></div>

          <div className="text-center">
            <div className="text-3xl font-black text-gray-700 mb-2 mt-2">{formatTime(ketQua.thoi_gian_hoan_thanh)}</div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Thời gian làm bài</div>
          </div>
        </div>
        
        <div className="pt-4 border-t flex justify-center gap-4">
          <Link 
            href={`/tai-khoan/lich-su`} 
            className="inline-flex items-center justify-center px-6 py-2 border rounded-full text-sm font-medium hover:bg-gray-50"
          >
            Xem lịch sử
          </Link>
          <Link 
            href={`/on-luyen/${ketQua.chuyen_de_ten ? ketQua.chuyen_de_ten : ''}`} // actually slug might be tricky, maybe just use back button or static path if available. Let's redirect to /on-luyen
            className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 shadow-md"
          >
            Thi lại / Ôn luyện tiếp
          </Link>
        </div>
      </div>

      {/* Chi tiết từng câu */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold px-2">Chi tiết bài làm</h3>
        {ketQua.chi_tiet_bai_lam.map((c, i) => (
          <div key={c.cau_hoi_id} className={`bg-white border-2 rounded-2xl p-6 shadow-sm ${c.dung ? 'border-green-100' : 'border-red-100'}`}>
            <div className="flex gap-4 mb-4">
              <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white font-bold ${c.dung ? 'bg-green-500' : 'bg-red-500'}`}>
                {i + 1}
              </div>
              <div>
                <div className="font-semibold text-gray-900 leading-relaxed mb-4">{c.noi_dung}</div>
                
                <div className="space-y-2">
                  {Object.entries(c.cac_lua_chon).map(([key, val]) => {
                    const isSelected = c.lua_chon_da_chon?.toUpperCase() === key.toUpperCase();
                    const isCorrect = c.dap_an_dung.toUpperCase() === key.toUpperCase();
                    
                    let bgClass = "bg-gray-50 border-gray-200 text-gray-700";
                    let icon = null;

                    if (isCorrect) {
                      bgClass = "bg-green-50 border-green-200 text-green-800 font-medium";
                      icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                    } else if (isSelected && !isCorrect) {
                      bgClass = "bg-red-50 border-red-200 text-red-800 font-medium";
                      icon = <XCircle className="w-5 h-5 text-red-600" />;
                    }

                    return (
                      <div key={key} className={`flex items-start gap-3 p-3 rounded-lg border ${bgClass}`}>
                        <div className="font-bold min-w-[24px]">{key.toUpperCase()}.</div>
                        <div className="flex-1">{val as string}</div>
                        {icon}
                      </div>
                    );
                  })}
                </div>

                {!c.lua_chon_da_chon && (
                  <div className="mt-3 text-red-500 font-medium text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Bạn chưa chọn đáp án cho câu này
                  </div>
                )}
                
                {c.can_cu_phap_ly && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50/50 p-3 rounded-lg">
                      <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-gray-900">Căn cứ:</strong> {c.can_cu_phap_ly}
                      </div>
                    </div>
                  </div>
                )}
                
                {c.giai_thich_chi_tiet && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <strong className="text-gray-900">Giải thích:</strong> {c.giai_thich_chi_tiet}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
