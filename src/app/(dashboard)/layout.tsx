import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { signout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/shared/utils/supabase/server'
import Link from 'next/link'
import { AIAssistantWidget } from '@/components/layout/AIAssistantWidget'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userFullName = '';
  let userEmail = user?.email || '';
  let role = 'free';
  if (user) {
    const { data: hocVien } = await supabase.from('hoc_vien').select('loai_tai_khoan, ho_ten').eq('id', user.id).single();
    if (hocVien) {
      role = hocVien.loai_tai_khoan;
      userFullName = hocVien.ho_ten || '';
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr]">
      <Sidebar userRole={role} userEmail={userEmail} userFullName={userFullName} />
      <div className="flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-gray-50/40 px-4 lg:h-[60px] lg:px-6">
          <MobileNav userRole={role} />
          <div className="w-full flex-1">
            {/* Search or breadcrumbs could go here */}
          </div>
          {!user && (
            <Link href="/login">
              <Button size="sm">Đăng nhập</Button>
            </Link>
          )}
        </header>
        <main className="flex-1 bg-gray-50/20 p-4 lg:p-6">
          {children}
        </main>
      </div>
      <AIAssistantWidget />
    </div>
  )
}
