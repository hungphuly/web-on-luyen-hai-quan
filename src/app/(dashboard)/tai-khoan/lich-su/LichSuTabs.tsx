'use client'

import { useState } from 'react';
import { CheckCircle2, XCircle, History, ChevronDown, Award } from 'lucide-react';
import { format } from 'date-fns';

export function LichSuTabs({ groupedOnLuyen, groupedThiThu, phienOnLuyenKeys, thiThuKeys }: any) {
  const [tab, setTab] = useState<'on_luyen' | 'thi_thu'>('thi_thu');

  return (
    <div className="space-y-6">
      {/* Tab controls */}
      <div className="flex bg-white rounded-lg p-1 border shadow-sm w-fit mx-auto md:mx-0">
        <button
          onClick={() => setTab('thi_thu')}
          className={`px-6 py-2.5 rounded-md font-semibold text-sm transition-colors ${tab === 'thi_thu' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Lịch sử Thi thử
        </button>
        <button
          onClick={() => setTab('on_luyen')}
          className={`px-6 py-2.5 rounded-md font-semibold text-sm transition-colors ${tab === 'on_luyen' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Lịch sử Ôn luyện
        </button>
      </div>

      {tab === 'thi_thu' && (
        <div className="space-y-4">
          {thiThuKeys.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
              Bạn chưa tham gia đợt thi thử nào.
            </div>
          ) : (
            thiThuKeys.map((key: string, index: number) => {
              const ls = groupedThiThu[key];
              const score = ls.diem_so; // is now a number
              const total = ls.chi_tiet_bai_lam.length;
              const tyLe = Math.round((score / total) * 100) || 0;
              const date = new Date(ls.ngay_thi);
              
              return (
                <details key={key} className="bg-white rounded-xl border shadow-sm group">
                  <summary className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer list-none hover:bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">Thi thử: {ls.chuyen_de_ten || 'Không xác định'}</h3>
                        <p className="text-sm text-muted-foreground">{format(date, 'dd/MM/yyyy - HH:mm')}</p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6 md:w-auto w-full border-t md:border-0 pt-4 md:pt-0">
                      <div className="text-sm font-medium">
                        Điểm số: <span className={tyLe >= 50 ? 'text-green-600 font-bold text-base' : 'text-orange-500 font-bold text-base'}>{score}/{total}</span>
                      </div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </div>
                  </summary>
                  <div className="border-t p-4 md:p-6 space-y-4 bg-gray-50">
                    <h4 className="font-bold text-sm uppercase text-gray-500 mb-2">Chi tiết từng câu</h4>
                    {ls.chi_tiet_bai_lam.map((c: any, i: number) => (
                      <div key={c.cau_hoi_id} className={`bg-white border rounded-lg p-4 shadow-sm ${c.dung ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div className="font-medium text-gray-900 text-sm leading-relaxed flex-1">
                            {i + 1}. {c.noi_dung}
                          </div>
                          <div className="shrink-0 mt-0.5">
                            {c.dung ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          Đáp án đúng: <span className="font-bold text-green-700">{c.dap_an_dung}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Bạn đã chọn: <span className={`font-bold ${c.dung ? 'text-green-700' : 'text-red-700'}`}>{c.lua_chon_da_chon?.toUpperCase() || 'Không chọn'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })
          )}
        </div>
      )}

      {tab === 'on_luyen' && (
        <div className="space-y-4">
          {phienOnLuyenKeys.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
              Bạn chưa trả lời câu hỏi nào.
            </div>
          ) : (
            phienOnLuyenKeys.map((phienId: string) => {
              const items = groupedOnLuyen[phienId];
              const dungCount = items.filter((i: any) => i.dung).length;
              const total = items.length;
              const chuyenDeTen = items[0].cau_hoi?.chuyen_de?.ten || 'Không rõ chuyên đề';
              const startTime = new Date(items[items.length - 1].ngay_lam); // Item cuối mảng là item cũ nhất của phiên

              return (
                <details key={phienId} className="bg-white rounded-xl border shadow-sm group">
                  <summary className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer list-none hover:bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-sidebar-active-bg text-primary rounded-xl shrink-0">
                        <History className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{phienId === 'phien-cu' ? 'Dữ liệu cũ' : chuyenDeTen}</h3>
                        <p className="text-sm text-muted-foreground">{format(startTime, 'dd/MM/yyyy - HH:mm')}</p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6 md:w-auto w-full border-t md:border-0 pt-4 md:pt-0">
                      <div className="text-sm font-medium">
                        Kết quả: <span className={dungCount >= total / 2 ? 'text-green-600 font-bold text-base' : 'text-orange-500 font-bold text-base'}>{dungCount}/{total}</span>
                      </div>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </div>
                  </summary>
                  <div className="border-t overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/50 text-gray-600">
                        <tr>
                          <th className="px-6 py-3 font-medium">Nội dung câu hỏi</th>
                          <th className="px-6 py-3 font-medium text-center w-24">Đã chọn</th>
                          <th className="px-6 py-3 font-medium text-center w-32">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((ls: any) => (
                          <tr key={ls.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4">
                              <p className="text-gray-900 line-clamp-2">{ls.cau_hoi?.noi_dung}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-bold text-gray-700 uppercase">{ls.lua_chon_da_chon}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                {ls.dung ? (
                                  <div className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4 mr-1" /> ĐÚNG
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold">
                                    <XCircle className="w-4 h-4 mr-1" /> SAI
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
