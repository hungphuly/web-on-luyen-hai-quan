'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ImportError } from '@/lib/modules/ngan-hang-de/types'
import { DanhMucChuyenDe } from '@/lib/modules/bai-giang/types'
import { importExcelQuestions } from './actions'
import { Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'

export function ImportForm({ chuyenDeList }: { chuyenDeList: DanhMucChuyenDe[] }) {
  const [file, setFile] = useState<File | null>(null)
  const [selectedChuyenDeId, setSelectedChuyenDeId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<ImportError[]>([])
  const [success, setSuccess] = useState<{ count: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setErrors([])
      setSuccess(null)
    }
  }

  const handleImport = () => {
    if (!file || !selectedChuyenDeId) return;

    startTransition(async () => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('chuyenDeId', selectedChuyenDeId)

      const result = await importExcelQuestions(formData)
      
      if (!result.success) {
        setErrors(result.errors || [])
        setSuccess(null)
      } else {
        setErrors([])
        setSuccess({ count: result.count || 0 })
        setFile(null)
      }
    })
  }

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Import dữ liệu từ Excel</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <select 
            className="border rounded-md px-3 py-2 text-sm bg-white min-w-[200px]"
            value={selectedChuyenDeId}
            onChange={(e) => setSelectedChuyenDeId(e.target.value)}
          >
            <option value="">-- Chọn chuyên đề áp dụng --</option>
            {chuyenDeList.map(cd => (
              <option key={cd.id} value={cd.id}>{cd.ten}</option>
            ))}
          </select>

          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary/10 file:text-primary
              hover:file:bg-primary/20"
          />
          <Button 
            onClick={handleImport} 
            disabled={!file || !selectedChuyenDeId || isPending}
            className="min-w-[120px]"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import
          </Button>
        </div>

        {/* Báo thành công */}
        {success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
            Đã import thành công {success.count} câu hỏi vào ngân hàng.
          </div>
        )}

        {/* Báo lỗi chi tiết */}
        {errors.length > 0 && (
          <div className="mt-4">
            <div className="p-4 bg-red-50 text-red-700 rounded-t-lg flex items-center font-medium">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              Import thất bại. Vui lòng sửa {errors.length} lỗi sau và thử lại:
            </div>
            <div className="border border-red-100 rounded-b-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-red-50/50 text-red-900 border-b border-red-100">
                  <tr>
                    <th className="px-4 py-2 w-20">Dòng</th>
                    <th className="px-4 py-2">Lý do lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0 bg-white">
                      <td className="px-4 py-2 font-medium text-gray-500">{err.row}</td>
                      <td className="px-4 py-2 text-red-600">{err.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
