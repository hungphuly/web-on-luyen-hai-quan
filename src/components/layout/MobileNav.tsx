'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MENU_CONFIG } from '@/config/menu.config'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export function MobileNav({ userRole }: { userRole?: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0 lg:hidden" />}>
        <Icons.Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <nav className="grid gap-2 text-lg font-medium">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold mb-4"
            onClick={() => setOpen(false)}
          >
            <Icons.BookOpen className="h-6 w-6 text-primary" />
            <span className="text-primary font-bold">Ôn Luyện Hải Quan</span>
          </Link>
          
          {MENU_CONFIG.map((group, groupIndex) => {
            // Ẩn nhóm Quản trị nếu không phải admin
            if (group.label === 'Quản trị' && userRole !== 'admin') {
              return null;
            }

            return (
              <div key={groupIndex} className="mb-4">
                {group.label !== 'Khám phá' && (
                  <h4 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h4>
                )}
                <div className="grid gap-1">
                  {group.items.map((item, index) => {
                    const Icon = item.icon ? (Icons as any)[item.icon.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')] : Icons.Circle;
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))

                    let iconColorClass = "text-muted-foreground"
                    if (isActive) {
                      iconColorClass = "text-primary"
                    } else if (item.href.startsWith('/on-luyen') || item.href.startsWith('/bai-giang') || item.href.startsWith('/tai-khoan')) {
                      iconColorClass = "text-blue-500"
                    } else if (item.href.startsWith('/tai-lieu')) {
                      iconColorClass = "text-accent"
                    } else if (item.href === '/ung-ho') {
                      iconColorClass = "text-rose-500"
                    } else if (item.href.startsWith('/admin')) {
                      iconColorClass = "text-slate-600"
                    }

                    return (
                      <Link
                        key={index}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all hover:text-primary hover:bg-sidebar-active-bg/50",
                          isActive ? "bg-sidebar-active-bg text-primary font-semibold" : "text-muted-foreground"
                        )}
                      >
                        {Icon && <Icon className={cn("h-5 w-5", iconColorClass)} />}
                        {item.title}
                      </Link>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
