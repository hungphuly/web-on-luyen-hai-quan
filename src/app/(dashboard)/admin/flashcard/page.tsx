'use client'

import { useState, useEffect, useTransition } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { importFlashcards } from './actions';
import { createClient } from '@/lib/shared/utils/supabase/client';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminFlashcardPage() {
  const [chuyenDeId, setChuyenDeId] = useState<string>('');
  const [chuyenDeList, setChuyenDeList] = useState<{id: string, ten: string}[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: string, error?: string } | null>(null);

  useEffect(() => {
    const fetchChuyenDe = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('danh_muc_chuyen_de').select('id, ten').order('thu_tu');
      if (data) setChuyenDeList(data);
    };
    fetchChuyenDe();
  }, []);

  const handleUpload = async () => {
    if (!chuyenDeId || !file) {
      setResult({ error: 'Vui lòng chọn chuyên đề và file' });
      return;
    }

    startTransition(async () => {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Mẫu: Mặt trước (A), Mặt sau (B)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['mat_truoc', 'mat_sau'], range: 1 });
        
        const validCards = jsonData.filter((row: any) => row.mat_truoc && row.mat_sau).map((row: any) => ({
          mat_truoc: String(row.mat_truoc).trim(),
          mat_sau: String(row.mat_sau).trim(),
        }));

        if (validCards.length === 0) {
          throw new Error("Không tìm thấy dòng nào hợp lệ (cần điền cả 2 cột)");
        }

        const res = await importFlashcards({ chuyenDeId, cards: validCards });
        setResult({ success: `Đã import thành công ${res.total} flashcards!` });
        setFile(null); // Reset
      } catch (e: any) {
        setResult({ error: e.message || 'Lỗi xử lý file' });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Import Flashcards bằng Excel</h1>
      
      <div className="space-y-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">1. Chọn chuyên đề</label>
          <select 
            className="w-full border p-2 rounded-lg"
            value={chuyenDeId}
            onChange={(e) => setChuyenDeId(e.target.value)}
          >
            <option value="">-- Chọn chuyên đề --</option>
            {chuyenDeList.map(cd => (
              <option key={cd.id} value={cd.id}>{cd.ten}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">2. Chọn file Excel (Cột A: Mặt trước, Cột B: Mặt sau)</label>
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary/90"
          />
        </div>

        {result?.success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {result.success}
          </div>
        )}
        
        {result?.error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {result.error}
          </div>
        )}

        <div className="pt-4 border-t">
          <Button onClick={handleUpload} disabled={isPending || !file || !chuyenDeId} className="w-full">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Bắt đầu Import
          </Button>
        </div>
      </div>
    </div>
  );
}
