'use client'

import React, { useState, useTransition } from 'react';
import { 
  Sparkles, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  UploadCloud, 
  Edit3, 
  Save, 
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  sinhNoiDungTuPDF, 
  duyetCauHoiNhap, 
  tuChoiCauHoiNhap, 
  suaCauHoiNhap,
  duyetFlashcardNhap,
  tuChoiFlashcardNhap,
  suaFlashcardNhap,
  getDanhSachCauHoiNhap,
  getDanhSachFlashcardNhap
} from '@/lib/modules/admin/actions/ai-soan-noi-dung.actions';

interface Props {
  chuyenDeList: { id: string; ten: string }[];
  taiLieuList: any[];
  initialCauHoiList: any[];
  initialFlashcardList: any[];
}

export function AISoanNoiDungClient({
  chuyenDeList,
  taiLieuList,
  initialCauHoiList,
  initialFlashcardList,
}: Props) {
  const [activeTab, setActiveTab] = useState<'tao' | 'cau-hoi' | 'flashcard'>('tao');
  const [isPending, startTransition] = useTransition();

  // Form State
  const [selectedChuyenDe, setSelectedChuyenDe] = useState<string>(chuyenDeList[0]?.id || '');
  const [sourceType, setSourceType] = useState<'r2' | 'upload'>('r2');
  const [selectedR2File, setSelectedR2File] = useState<string>(taiLieuList[0]?.duong_dan_file || '');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loaiNoiDung, setLoaiNoiDung] = useState<'cau_hoi' | 'flashcard' | 'ca_hai'>('ca_hai');
  const [soLuongCauHoi, setSoLuongCauHoi] = useState<number>(5);
  const [soLuongFlashcard, setSoLuongFlashcard] = useState<number>(8);

  // Status & Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data lists
  const [cauHoiList, setCauHoiList] = useState<any[]>(initialCauHoiList);
  const [flashcardList, setFlashcardList] = useState<any[]>(initialFlashcardList);

  // Filters
  const [cauHoiFilterStatus, setCauHoiFilterStatus] = useState<string>('cho_duyet');
  const [cauHoiFilterChuyenDe, setCauHoiFilterChuyenDe] = useState<string>('all');
  const [flashcardFilterStatus, setFlashcardFilterStatus] = useState<string>('cho_duyet');
  const [flashcardFilterChuyenDe, setFlashcardFilterChuyenDe] = useState<string>('all');

  // Editing items state
  const [editingCauHoiId, setEditingCauHoiId] = useState<string | null>(null);
  const [editingCauHoiData, setEditingCauHoiData] = useState<any>(null);

  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(null);
  const [editingFlashcardData, setEditingFlashcardData] = useState<{ mat_truoc: string; mat_sau: string } | null>(null);

  // Refresh lists
  const reloadData = async () => {
    const ch = await getDanhSachCauHoiNhap(cauHoiFilterStatus, cauHoiFilterChuyenDe);
    const fc = await getDanhSachFlashcardNhap(flashcardFilterStatus, flashcardFilterChuyenDe);
    setCauHoiList(ch);
    setFlashcardList(fc);
  };

  // Handler: Sinh nội dung
  const handleSinhNoiDung = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    let fileBufferBase64: string | undefined;
    let fileName = selectedR2File;

    if (sourceType === 'upload') {
      if (!uploadedFile) {
        setNotification({ type: 'error', message: 'Vui lòng chọn file PDF để tải lên.' });
        return;
      }
      fileName = uploadedFile.name;
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      fileBufferBase64 = btoa(binary);
    } else {
      if (!fileName) {
        setNotification({ type: 'error', message: 'Vui lòng chọn một văn bản pháp luật có sẵn trên R2.' });
        return;
      }
    }

    startTransition(async () => {
      const res = await sinhNoiDungTuPDF({
        chuyenDeId: selectedChuyenDe,
        nguonFile: fileName,
        loaiNoiDung,
        soLuongCauHoi,
        soLuongFlashcard,
        fileBufferBase64,
      });

      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        await reloadData();
        if (loaiNoiDung === 'cau_hoi') setActiveTab('cau-hoi');
        else if (loaiNoiDung === 'flashcard') setActiveTab('flashcard');
        else setActiveTab('cau-hoi');
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    });
  };

  // Actions for Cau Hoi
  const handleDuyetCauHoi = (id: string) => {
    startTransition(async () => {
      const res = await duyetCauHoiNhap(id);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        await reloadData();
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    });
  };

  const handleTuChoiCauHoi = (id: string) => {
    startTransition(async () => {
      const res = await tuChoiCauHoiNhap(id);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        await reloadData();
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    });
  };

  const handleSaveCauHoi = (id: string) => {
    if (!editingCauHoiData) return;
    startTransition(async () => {
      const res = await suaCauHoiNhap(id, editingCauHoiData);
      if (res.success) {
        setEditingCauHoiId(null);
        setEditingCauHoiData(null);
        setNotification({ type: 'success', message: 'Đã lưu chỉnh sửa!' });
        await reloadData();
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    });
  };

  // Actions for Flashcard
  const handleDuyetFlashcard = (id: string) => {
    startTransition(async () => {
      const res = await duyetFlashcardNhap(id);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        await reloadData();
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    });
  };

  const handleTuChoiFlashcard = (id: string) => {
    startTransition(async () => {
      const res = await tuChoiFlashcardNhap(id);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        await reloadData();
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    });
  };

  const handleSaveFlashcard = (id: string) => {
    if (!editingFlashcardData) return;
    startTransition(async () => {
      const res = await suaFlashcardNhap(id, editingFlashcardData.mat_truoc, editingFlashcardData.mat_sau);
      if (res.success) {
        setEditingFlashcardId(null);
        setEditingFlashcardData(null);
        setNotification({ type: 'success', message: 'Đã lưu chỉnh sửa flashcard!' });
        await reloadData();
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    });
  };

  const choDuyetCauHoiCount = cauHoiList.filter(q => q.trang_thai === 'cho_duyet').length;
  const choDuyetFlashcardCount = flashcardList.filter(f => f.trang_thai === 'cho_duyet').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">AI Soạn Nội Dung & Duyệt Nháp</h1>
          </div>
          <p className="text-sm text-gray-600">
            Sử dụng Cloudflare Workers AI trích xuất PDF trực tiếp từ R2 để tự động sinh câu hỏi trắc nghiệm & flashcard nháp. Mọi nội dung đều được kiểm duyệt bởi Admin trước khi xuất bản.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloudflare Workers AI
          </span>
        </div>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tao')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tao'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          1. Sinh nội dung từ PDF
        </button>

        <button
          onClick={() => setActiveTab('cau-hoi')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'cau-hoi'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          2. Duyệt câu hỏi nháp
          {choDuyetCauHoiCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-bold">
              {choDuyetCauHoiCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('flashcard')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'flashcard'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          3. Duyệt flashcard nháp
          {choDuyetFlashcardCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-bold">
              {choDuyetFlashcardCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TẠO NỘI DUNG TỪ PDF */}
      {activeTab === 'tao' && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm max-w-3xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            Cấu hình sinh nội dung AI từ tài liệu
          </h2>

          <form onSubmit={handleSinhNoiDung} className="space-y-5">
            {/* Chuyên đề */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Chuyên đề áp dụng <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedChuyenDe}
                onChange={(e) => setSelectedChuyenDe(e.target.value)}
                required
                className="w-full border rounded-xl p-3 bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {chuyenDeList.map((cd) => (
                  <option key={cd.id} value={cd.id}>
                    {cd.ten}
                  </option>
                ))}
              </select>
            </div>

            {/* Nguồn tài liệu PDF */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nguồn tài liệu PDF <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setSourceType('r2')}
                  className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    sourceType === 'r2'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Văn bản có sẵn trên R2 ({taiLieuList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('upload')}
                  className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    sourceType === 'upload'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  Tải lên file PDF từ máy
                </button>
              </div>

              {sourceType === 'r2' ? (
                <div>
                  <select
                    value={selectedR2File}
                    onChange={(e) => setSelectedR2File(e.target.value)}
                    className="w-full border rounded-xl p-3 bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {taiLieuList.map((tl) => (
                      <option key={tl.id} value={tl.duong_dan_file}>
                        {tl.ten_van_ban} ({tl.so_hieu || 'Không có số hiệu'})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    File sẽ được Cloudflare Workers AI chuyển sang Markdown và đọc trực tiếp từ Cloudflare R2.
                  </p>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="w-full border rounded-xl p-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Hỗ trợ file định dạng PDF văn bản pháp luật, tài liệu nghiệp vụ (tối đa 20MB).
                  </p>
                </div>
              )}
            </div>

            {/* Loại nội dung cần sinh */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Loại nội dung muốn sinh
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'ca_hai', label: 'Cả hai loại' },
                  { value: 'cau_hoi', label: 'Chỉ Câu hỏi' },
                  { value: 'flashcard', label: 'Chỉ Flashcard' },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`p-3 rounded-xl border text-center cursor-pointer text-sm font-semibold transition-all ${
                      loaiNoiDung === item.value
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="loaiNoiDung"
                      value={item.value}
                      checked={loaiNoiDung === item.value}
                      onChange={() => setLoaiNoiDung(item.value as any)}
                      className="sr-only"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Số lượng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(loaiNoiDung === 'cau_hoi' || loaiNoiDung === 'ca_hai') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số câu hỏi trắc nghiệm (Tối đa 15)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={soLuongCauHoi}
                    onChange={(e) => setSoLuongCauHoi(parseInt(e.target.value) || 5)}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
              )}

              {(loaiNoiDung === 'flashcard' || loaiNoiDung === 'ca_hai') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng flashcard (Tối đa 20)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={soLuongFlashcard}
                    onChange={(e) => setSoLuongFlashcard(parseInt(e.target.value) || 8)}
                    className="w-full border rounded-xl p-2.5 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto h-11 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý PDF & Sinh nội dung AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Bắt đầu sinh nội dung (Cloudflare AI)
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: DUYỆT CÂU HỎI NHÁP */}
      {activeTab === 'cau-hoi' && (
        <div className="space-y-4">
          {/* Bộ lọc */}
          <div className="bg-white p-4 rounded-xl border shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-700">Lọc theo:</span>
              </div>

              <select
                value={cauHoiFilterStatus}
                onChange={async (e) => {
                  setCauHoiFilterStatus(e.target.value);
                  const res = await getDanhSachCauHoiNhap(e.target.value, cauHoiFilterChuyenDe);
                  setCauHoiList(res);
                }}
                className="border rounded-lg px-3 py-1.5 text-sm bg-white font-medium"
              >
                <option value="cho_duyet">Chờ duyệt</option>
                <option value="da_duyet">Đã duyệt</option>
                <option value="tu_choi">Từ chối</option>
                <option value="all">Tất cả trạng thái</option>
              </select>

              <select
                value={cauHoiFilterChuyenDe}
                onChange={async (e) => {
                  setCauHoiFilterChuyenDe(e.target.value);
                  const res = await getDanhSachCauHoiNhap(cauHoiFilterStatus, e.target.value);
                  setCauHoiList(res);
                }}
                className="border rounded-lg px-3 py-1.5 text-sm bg-white font-medium max-w-xs truncate"
              >
                <option value="all">Tất cả chuyên đề</option>
                {chuyenDeList.map((cd) => (
                  <option key={cd.id} value={cd.id}>
                    {cd.ten}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-semibold text-gray-500">
              Tổng số: {cauHoiList.length} câu hỏi
            </span>
          </div>

          {/* Danh sách câu hỏi */}
          {cauHoiList.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-base">Không có câu hỏi nháp nào phù hợp với bộ lọc.</p>
              <p className="text-xs text-gray-400 mt-1">Chuyển sang tab &quot;Sinh nội dung từ PDF&quot; để tạo mới.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cauHoiList.map((item, idx) => {
                const isEditing = editingCauHoiId === item.id;
                const isChoDuyet = item.trang_thai === 'cho_duyet';

                return (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all ${
                      item.can_kiem_tra ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'
                    }`}
                  >
                    {/* Top Row: Meta badges & status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                          {item.danh_muc_chuyen_de?.ten || 'Chuyên đề'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          Độ khó: {item.do_kho === 'de' ? 'Dễ' : item.do_kho === 'kho' ? 'Khó' : 'TB'}
                        </span>
                        {item.can_kiem_tra && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Cần kiểm tra lại căn cứ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          item.trang_thai === 'cho_duyet' ? 'bg-amber-100 text-amber-800' :
                          item.trang_thai === 'da_duyet' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.trang_thai === 'cho_duyet' ? 'Chờ duyệt' :
                           item.trang_thai === 'da_duyet' ? 'Đã duyệt' : 'Từ chối'}
                        </span>
                      </div>
                    </div>

                    {/* Content View / Edit */}
                    {isEditing ? (
                      <div className="space-y-4 pt-2 border-t">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Nội dung câu hỏi</label>
                          <textarea
                            rows={3}
                            value={editingCauHoiData.noi_dung}
                            onChange={(e) => setEditingCauHoiData({ ...editingCauHoiData, noi_dung: e.target.value })}
                            className="w-full border rounded-lg p-2.5 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {['a', 'b', 'c', 'd'].map((key) => (
                            <div key={key}>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                                Lựa chọn {key}
                              </label>
                              <input
                                type="text"
                                value={editingCauHoiData.cac_lua_chon?.[key] || ''}
                                onChange={(e) => setEditingCauHoiData({
                                  ...editingCauHoiData,
                                  cac_lua_chon: {
                                    ...editingCauHoiData.cac_lua_chon,
                                    [key]: e.target.value,
                                  }
                                })}
                                className="w-full border rounded-lg p-2 text-sm"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Đáp án đúng</label>
                            <select
                              value={editingCauHoiData.dap_an_dung}
                              onChange={(e) => setEditingCauHoiData({ ...editingCauHoiData, dap_an_dung: e.target.value })}
                              className="w-full border rounded-lg p-2 text-sm bg-white"
                            >
                              <option value="a">A</option>
                              <option value="b">B</option>
                              <option value="c">C</option>
                              <option value="d">D</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Độ khó</label>
                            <select
                              value={editingCauHoiData.do_kho}
                              onChange={(e) => setEditingCauHoiData({ ...editingCauHoiData, do_kho: e.target.value })}
                              className="w-full border rounded-lg p-2 text-sm bg-white"
                            >
                              <option value="de">Dễ</option>
                              <option value="trung_binh">Trung bình</option>
                              <option value="kho">Khó</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Cần kiểm tra</label>
                            <select
                              value={editingCauHoiData.can_kiem_tra ? 'true' : 'false'}
                              onChange={(e) => setEditingCauHoiData({ ...editingCauHoiData, can_kiem_tra: e.target.value === 'true' })}
                              className="w-full border rounded-lg p-2 text-sm bg-white"
                            >
                              <option value="false">Không (Đã chuẩn)</option>
                              <option value="true">Có (Cảnh báo)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Căn cứ pháp lý</label>
                          <input
                            type="text"
                            value={editingCauHoiData.can_cu_phap_ly || ''}
                            onChange={(e) => setEditingCauHoiData({ ...editingCauHoiData, can_cu_phap_ly: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setEditingCauHoiId(null);
                              setEditingCauHoiData(null);
                            }}
                          >
                            Hủy
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-primary text-white"
                            onClick={() => handleSaveCauHoi(item.id)}
                            disabled={isPending}
                          >
                            <Save className="w-3.5 h-3.5 mr-1" />
                            Lưu sửa đổi
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="font-bold text-base text-gray-900 leading-relaxed">
                          {item.noi_dung}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                          {['a', 'b', 'c', 'd'].map((key) => {
                            const val = item.cac_lua_chon?.[key];
                            if (!val) return null;
                            const isCorrect = item.dap_an_dung?.toLowerCase() === key;

                            return (
                              <div
                                key={key}
                                className={`p-2.5 rounded-xl border text-sm flex items-start gap-2.5 ${
                                  isCorrect 
                                    ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900' 
                                    : 'bg-gray-50/60 border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {key.toUpperCase()}
                                </span>
                                <span className="flex-1">{val}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                          <div>
                            <span className="font-semibold text-gray-700">Căn cứ pháp lý: </span>
                            <span className={item.can_cu_phap_ly ? 'text-gray-900 font-medium' : 'text-red-500 italic'}>
                              {item.can_cu_phap_ly || 'Chưa có căn cứ pháp lý'}
                            </span>
                            {item.nguon_file && (
                              <span className="ml-3 text-gray-400">Nguồn: {item.nguon_file}</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 ml-auto">
                            {isChoDuyet && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCauHoiId(item.id);
                                    setEditingCauHoiData({ ...item });
                                  }}
                                  disabled={isPending}
                                  className="h-8 text-xs font-semibold"
                                >
                                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                                  Sửa
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTuChoiCauHoi(item.id)}
                                  disabled={isPending}
                                  className="h-8 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Từ chối
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => handleDuyetCauHoi(item.id)}
                                  disabled={isPending}
                                  className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Duyệt vào ngân hàng đề
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DUYỆT FLASHCARD NHÁP */}
      {activeTab === 'flashcard' && (
        <div className="space-y-4">
          {/* Bộ lọc */}
          <div className="bg-white p-4 rounded-xl border shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-700">Lọc theo:</span>
              </div>

              <select
                value={flashcardFilterStatus}
                onChange={async (e) => {
                  setFlashcardFilterStatus(e.target.value);
                  const res = await getDanhSachFlashcardNhap(e.target.value, flashcardFilterChuyenDe);
                  setFlashcardList(res);
                }}
                className="border rounded-lg px-3 py-1.5 text-sm bg-white font-medium"
              >
                <option value="cho_duyet">Chờ duyệt</option>
                <option value="da_duyet">Đã duyệt</option>
                <option value="tu_choi">Từ chối</option>
                <option value="all">Tất cả trạng thái</option>
              </select>

              <select
                value={flashcardFilterChuyenDe}
                onChange={async (e) => {
                  setFlashcardFilterChuyenDe(e.target.value);
                  const res = await getDanhSachFlashcardNhap(flashcardFilterStatus, e.target.value);
                  setFlashcardList(res);
                }}
                className="border rounded-lg px-3 py-1.5 text-sm bg-white font-medium max-w-xs truncate"
              >
                <option value="all">Tất cả chuyên đề</option>
                {chuyenDeList.map((cd) => (
                  <option key={cd.id} value={cd.id}>
                    {cd.ten}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-semibold text-gray-500">
              Tổng số: {flashcardList.length} flashcard
            </span>
          </div>

          {/* Danh sách flashcard */}
          {flashcardList.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-base">Không có flashcard nháp nào phù hợp với bộ lọc.</p>
              <p className="text-xs text-gray-400 mt-1">Chuyển sang tab &quot;Sinh nội dung từ PDF&quot; để tạo mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcardList.map((fc, idx) => {
                const isEditing = editingFlashcardId === fc.id;
                const isChoDuyet = fc.trang_thai === 'cho_duyet';

                return (
                  <div key={fc.id} className="bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b pb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Thẻ #{idx + 1}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          fc.trang_thai === 'cho_duyet' ? 'bg-amber-100 text-amber-800' :
                          fc.trang_thai === 'da_duyet' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {fc.trang_thai === 'cho_duyet' ? 'Chờ duyệt' :
                           fc.trang_thai === 'da_duyet' ? 'Đã duyệt' : 'Từ chối'}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Mặt trước (Khái niệm/Câu hỏi)</label>
                            <textarea
                              rows={2}
                              value={editingFlashcardData?.mat_truoc || ''}
                              onChange={(e) => setEditingFlashcardData({
                                ...editingFlashcardData!,
                                mat_truoc: e.target.value
                              })}
                              className="w-full border rounded-lg p-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Mặt sau (Giải thích/Căn cứ)</label>
                            <textarea
                              rows={3}
                              value={editingFlashcardData?.mat_sau || ''}
                              onChange={(e) => setEditingFlashcardData({
                                ...editingFlashcardData!,
                                mat_sau: e.target.value
                              })}
                              className="w-full border rounded-lg p-2 text-sm"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setEditingFlashcardId(null);
                                setEditingFlashcardData(null);
                              }}
                            >
                              Hủy
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-primary text-white"
                              onClick={() => handleSaveFlashcard(fc.id)}
                            >
                              Lưu
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                              Mặt trước:
                            </span>
                            <p className="text-sm font-semibold text-gray-900">{fc.mat_truoc}</p>
                          </div>

                          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                              Mặt sau:
                            </span>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{fc.mat_sau}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="pt-3 border-t mt-4 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400 truncate max-w-[120px]">
                          {fc.nguon_file || 'PDF'}
                        </span>

                        {isChoDuyet && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingFlashcardId(fc.id);
                                setEditingFlashcardData({ mat_truoc: fc.mat_truoc, mat_sau: fc.mat_sau });
                              }}
                              className="h-8 px-2 text-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTuChoiFlashcard(fc.id)}
                              className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50 border-red-200"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Từ chối
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleDuyetFlashcard(fc.id)}
                              className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Duyệt
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
