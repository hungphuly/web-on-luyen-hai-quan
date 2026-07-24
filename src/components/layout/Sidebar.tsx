'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MENU_CONFIG } from '@/config/menu.config'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

export function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-background lg:block lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-20">
      <div className="flex h-full flex-col gap-2 relative">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link className="flex items-center gap-2 font-semibold py-2" href="/">
            <Icons.BookOpen className="h-7 w-7 shrink-0 text-primary" />
            <span className="text-primary font-bold text-sm leading-tight uppercase">
              Ôn Luyện Thi Chứng Chỉ<br/>Nghiệp Vụ Hải Quan
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium gap-6">
            {MENU_CONFIG.map((group, groupIndex) => {
              // Ẩn nhóm Quản trị nếu không phải admin
              if (group.label === 'Quản trị' && userRole !== 'admin') {
                return null;
              }

              const WatermarkIcon = group.iconWatermark 
                ? (Icons as any)[group.iconWatermark.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')] 
                : null;

              return (
                <div key={groupIndex} className="relative">
                  {WatermarkIcon && (
                    <WatermarkIcon className="absolute -top-2 -right-2 w-16 h-16 text-primary/5 -z-10 pointer-events-none" />
                  )}
                  
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
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-sidebar-active-bg/50",
                            isActive ? "bg-sidebar-active-bg text-primary font-semibold" : "text-muted-foreground"
                          )}
                        >
                          {Icon && <Icon className={cn("h-4 w-4", iconColorClass)} />}
                          {item.title}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
