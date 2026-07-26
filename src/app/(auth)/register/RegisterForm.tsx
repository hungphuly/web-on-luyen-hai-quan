'use client'

import { useState } from 'react'
import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterForm({ errorParam }: { errorParam?: string }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState(errorParam)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp!')
      setIsLoading(false)
      return
    }

    try {
      await signup(formData)
      // Note: signup calls redirect() which throws an error that Next.js catches, 
      // but if it fails, it might redirect to /register?error=...
    } catch (err: any) {
      if (err.message !== 'NEXT_REDIRECT') {
        setError(err.message || 'Đã xảy ra lỗi')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16">
      <div>
        <Label htmlFor="ho_ten">Họ tên</Label>
        <Input id="ho_ten" name="ho_ten" type="text" placeholder="Nguyễn Văn A" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="user@example.com" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative mt-1">
          <Input 
            id="password" 
            name="password" 
            type={showPassword ? "text" : "password"} 
            required 
            minLength={6} 
            className="pr-10"
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
        <div className="relative mt-1">
          <Input 
            id="confirmPassword" 
            name="confirmPassword" 
            type={showConfirmPassword ? "text" : "password"} 
            required 
            minLength={6} 
            className="pr-10"
          />
          <button 
            type="button" 
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
      </Button>
      <p className="text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-gray-800 transition-colors hover:text-black">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}
