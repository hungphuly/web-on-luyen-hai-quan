import { createClient } from '@/lib/shared/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as Icons from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile from hoc_vien
  const { data: profile } = await supabase
    .from('hoc_vien')
    .select('*')
    .eq('id', user.id)
    .single()

  async function updatePassword(formData: FormData) {
    'use server'
    const password = formData.get('password') as string
    const supabaseServer = await createClient()
    const { error } = await supabaseServer.auth.updateUser({
      password: password
    })
    
    if (error) {
      redirect('/profile?error=' + encodeURIComponent(error.message))
    }
    redirect('/profile?message=' + encodeURIComponent('Cập nhật mật khẩu thành công'))
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hồ sơ cá nhân</h1>
      
      <div className="bg-white p-6 rounded-xl border border-primary/20 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
          <Icons.UserCircle className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-gray-800">Thông tin tài khoản</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-500">Họ và tên</Label>
            <p className="font-semibold text-gray-900 text-lg whitespace-nowrap">{profile?.ho_ten || 'Đang cập nhật'}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-500">Email</Label>
            <p className="font-semibold text-gray-900 text-lg whitespace-nowrap">{profile?.email || 'Đang cập nhật'}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-500">Loại tài khoản</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center rounded-full bg-sidebar-active-bg px-2.5 py-0.5 text-sm font-medium text-primary capitalize">
                {profile?.loai_tai_khoan || 'Free'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-primary/20 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
          <Icons.KeyRound className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-gray-800">Đổi mật khẩu</h2>
        </div>
        <form action={updatePassword} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu mới</Label>
            <Input id="password" name="password" type="password" required minLength={6} placeholder="Nhập ít nhất 6 ký tự" />
          </div>
          <Button type="submit" className="w-full sm:w-auto">Cập nhật mật khẩu</Button>
        </form>
      </div>
    </div>
  )
}
