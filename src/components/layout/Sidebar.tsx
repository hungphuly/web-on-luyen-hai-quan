'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MENU_CONFIG } from '@/config/menu.config'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

export function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname()
  
  // Khởi tạo state cho các nhóm đang mở (accordion)
  const [openGroups, setOpenGroups] = useState<string[]>([])

  // Tự động mở nhóm chứa trang hiện tại khi render lần đầu
  useEffect(() => {
    const activeGroupLabels: string[] = []
    MENU_CONFIG.forEach(group => {
      if (group.label === 'Quản trị' && userRole !== 'admin') return;
      const hasActive = group.items.some(item => 
        pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
      )
      if (hasActive) {
        activeGroupLabels.push(group.label)
      }
    })
    setOpenGroups(activeGroupLabels)
  }, [pathname, userRole])

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label) 
        : [...prev, label]
    )
  }

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
          <nav className="grid items-start px-4 text-sm font-medium gap-4">
            {MENU_CONFIG.map((group, groupIndex) => {
              // Ẩn nhóm Quản trị nếu không phải admin
              if (group.label === 'Quản trị' && userRole !== 'admin') {
                return null;
              }

              const WatermarkIcon = group.iconWatermark 
                ? (Icons as any)[group.iconWatermark.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')] 
                : null;
              
              const isOpen = openGroups.includes(group.label)

              return (
                <div key={groupIndex} className="relative">
                  {WatermarkIcon && (
                    <WatermarkIcon className="absolute -top-2 -right-2 w-16 h-16 text-primary/5 -z-10 pointer-events-none" />
                  )}
                  
                  {group.label !== 'Khám phá' && (
                    <button 
                      onClick={() => toggleGroup(group.label)}
                      className="w-full flex items-center justify-between mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <span>{group.label}</span>
                      <Icons.ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
                    </button>
                  )}
                  
                  <div className={cn(
                    "grid gap-1 overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen || group.label === 'Khám phá' ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                  )}>
                    <div className="min-h-0 overflow-hidden flex flex-col gap-1">
                      {group.items.map((item, index) => {
                        const Icon = item.icon ? (Icons as any)[item.icon.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')] : Icons.Circle;
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))

                        let iconColorClass = "text-muted-foreground"
                        let bgClass = "bg-muted/50"
                        if (isActive) {
                          iconColorClass = "text-primary"
                          bgClass = "bg-primary/15"
                        } else if (item.href.startsWith('/on-luyen') || item.href.startsWith('/bai-giang') || item.href.startsWith('/tai-khoan')) {
                          iconColorClass = "text-blue-600"
                          bgClass = "bg-blue-600/10"
                        } else if (item.href.startsWith('/tai-lieu')) {
                          iconColorClass = "text-amber-600"
                          bgClass = "bg-amber-600/10"
                        } else if (item.href === '/ung-ho') {
                          iconColorClass = "text-rose-600"
                          bgClass = "bg-rose-600/10"
                        } else if (item.href.startsWith('/admin')) {
                          iconColorClass = "text-slate-600"
                          bgClass = "bg-slate-600/10"
                        }

                        return (
                          <Link
                            key={index}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-sidebar-active-bg/50 group",
                              isActive ? "bg-sidebar-active-bg text-primary font-semibold" : "text-muted-foreground"
                            )}
                          >
                            <div className={cn("p-1.5 rounded-md flex items-center justify-center transition-colors group-hover:bg-primary/10 group-hover:text-primary", bgClass)}>
                              {Icon && <Icon className={cn("h-4 w-4", iconColorClass, "group-hover:text-primary")} />}
                            </div>
                            {item.title}
                          </Link>
                        )
                      })}
                    </div>
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
