import Dashboard from "@/app/dashboards/page"
import page from "@/app/page"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSubItem

  } from "@/components/ui/sidebar"
import { url } from "inspector"
import { ChartAreaIcon, Home, SmileIcon } from "lucide-react"
import { ThemeProvider } from "next-themes"
import { ThemeSwitcher } from "./theme-switcher"
import Link from "next/link"

  const items = [
    {
      title: "Início",
      icon: Home,
      url: "/protected"  
    },

    {
      title: "Dashboard Eleicoes Anteriores",
      icon: ChartAreaIcon,
      url: "/dashboards"
    }
  ]
  
  export function AppSidebar() {
    return (
      <Sidebar>

        <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-center">
            <Link href="/">
              <SmileIcon /> Logo aqui! 
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup />
          <SidebarGroupLabel>Menu</SidebarGroupLabel> 
          <SidebarGroupContent>
            <SidebarMenu className="pl-2">
              {items.map((item) => (
                <SidebarMenuSubItem key = {item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                      </a>
                  </SidebarMenuButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroup />
        </SidebarContent>
        <SidebarFooter>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >

        </ThemeProvider>
        <ThemeSwitcher />
        </SidebarFooter>
      </Sidebar>
    )
  }
  