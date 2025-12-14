"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { navigation } from "@/config/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <Link
          href="/"
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg text-base font-semibold">
            M
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold leading-tight">
              Memoir
            </span>
            <span className="truncate text-xs text-muted-foreground leading-tight">
              Personal knowledge base
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2">
        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        {item.badge ? (
                          <SidebarMenuBadge className="text-[10px] font-semibold">
                            {item.badge}
                          </SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="border-sidebar-border bg-sidebar/60 text-sidebar-foreground/80 rounded-lg border px-3 py-2 text-xs leading-relaxed">
          <div className="text-sidebar-foreground font-semibold">
            Workspace tips
          </div>
          <p className="text-muted-foreground">
            Pin your favorite sections to keep them within reach.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
