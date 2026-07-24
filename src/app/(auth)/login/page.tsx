import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold">Đăng nhập</h3>
          <p className="text-sm text-gray-500">Đăng nhập bằng tài khoản của bạn</p>
        </div>
        <form action={login} className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="user@example.com" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" name="password" type="password" required className="mt-1" />
          </div>
          
          {params?.error && (
            <p className="text-sm text-red-600">{params.error}</p>
          )}

          <Button type="submit">Đăng nhập</Button>
          <p className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-semibold text-gray-800 transition-colors hover:text-black">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
