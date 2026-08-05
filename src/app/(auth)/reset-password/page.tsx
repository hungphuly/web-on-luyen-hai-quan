import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '../actions'
import Link from 'next/link'
import { createClient } from '@/lib/shared/utils/supabase/server'
import { KeyRound, AlertCircle } from 'lucide-react'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
        <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Liên kết đã hết hạn hoặc không hợp lệ</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Phiên đặt lại mật khẩu của bạn đã hết hạn hoặc liên kết không còn hiệu lực. Vui lòng gửi lại yêu cầu để nhận liên kết mới.
          </p>
          <Link
            href="/quen-mat-khau"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-[#1B4D3E] text-white rounded-lg font-medium hover:bg-[#153e32] transition shadow-sm"
          >
            Gửi lại yêu cầu Quên mật khẩu
          </Link>
          <p className="mt-4 text-xs text-gray-400">
            Hoặc quay lại <Link href="/login" className="text-[#1B4D3E] font-medium hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-2 border-b border-gray-100 bg-emerald-50/50 px-4 py-6 pt-8 text-center sm:px-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E]">
            <KeyRound className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#1B4D3E]">Cập nhật mật khẩu mới</h3>
          <p className="text-xs text-gray-500">
            Tài khoản: <span className="font-semibold text-gray-700">{user.email}</span>
          </p>
        </div>
        <form action={updatePassword} className="flex flex-col space-y-4 px-6 py-8 sm:px-12">
          <div>
            <Label htmlFor="password">Mật khẩu mới</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)" 
              required 
              className="mt-1" 
              minLength={6} 
            />
          </div>
          
          {params?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {params.error}
            </div>
          )}

          <Button type="submit" className="w-full bg-[#1B4D3E] hover:bg-[#153e32] text-white font-medium py-2.5 shadow-sm">
            Lưu mật khẩu mới
          </Button>
          <p className="text-center text-sm text-gray-500 pt-2">
            Quay lại{' '}
            <Link href="/login" className="font-semibold text-[#1B4D3E] hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
