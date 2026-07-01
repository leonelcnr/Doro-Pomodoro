import * as React from "react"
import {
  IconCalendarEvent,
  IconChartBar,
  IconInnerShadowTop,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ThemeTogglerButton } from "@/components/ui/theme-toggler"
import { useAuth } from "@/features/auth/context/useAuth"
import { DailyStreak } from "./daily-streak"



const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard", //Aca le puse esta ruta pq es la unica que tenemos momentaneamente.
      icon: IconChartBar,
    },
    {
      title: "Calendario",
      url: "/calendar",
      icon: IconCalendarEvent,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const auth = useAuth();
  const user = {
    name: auth.user?.name || auth.user?.user_metadata?.name || "Usuario",
    email: auth.user?.isAnonymous ? "" : (auth.user?.email || ""),
    avatar: auth.user?.avatar_url || auth.user?.user_metadata?.avatar_url || "",
    isAnonymous: auth.user?.isAnonymous || false
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-primary">
                  <IconInnerShadowTop className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-lg">Doro</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <DailyStreak />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <ThemeTogglerButton className="w-full h-8" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
