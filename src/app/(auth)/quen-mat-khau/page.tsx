import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { resetPassword } from '../actions'

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string, error?: string }> }) {
  const params = await searchParams;
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold">Quên mật khẩu</h3>
          <p className="text-sm text-gray-500">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>
        <form action={resetPassword} className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="user@example.com" required className="mt-1" />
          </div>
          
          {params?.error && (
            <p className="text-sm text-red-600">{params.error}</p>
          )}
          {params?.message && (
            <p className="text-sm text-green-600">{params.message}</p>
          )}

          <Button type="submit">Gửi liên kết</Button>
          <p className="text-center text-sm text-gray-500">
            Quay lại{' '}
            <Link href="/login" className="font-semibold text-gray-800 transition-colors hover:text-black">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
