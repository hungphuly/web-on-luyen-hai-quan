'use client'

import { useState } from 'react'
import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginForm({ errorParam, messageParam }: { errorParam?: string, messageParam?: string }) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(errorParam)
  const [message, setMessage] = useState(messageParam)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)

    try {
      await login(formData)
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
      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800 border border-green-200">
          {message}
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="user@example.com" required className="mt-1" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mật khẩu</Label>
          <Link href="/quen-mat-khau" className="text-sm font-medium text-primary hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative mt-1">
          <Input 
            id="password" 
            name="password" 
            type={showPassword ? "text" : "password"} 
            required 
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
      
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
      </Button>
      <p className="text-center text-sm text-gray-500">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-gray-800 transition-colors hover:text-black">
          Đăng ký ngay
        </Link>
      </p>
    </form>
  )
}
