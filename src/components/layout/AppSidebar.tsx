import { BookOpen, History, Play, Settings as SettingsIcon, Users } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface AppSidebarProps { onOpenSettings: () => void; }

const navItems = [
  { title: "How it works", url: "/", icon: BookOpen, match: (path: string) => path === "/" },
  { title: "Personas", url: "/personas", icon: Users, match: (path: string) => path === "/personas" || path.startsWith("/persona") },
  { title: "Run test", url: "/test/new", icon: Play, match: (path: string) => path === "/test/new" },
  { title: "History", url: "/history", icon: History, match: (path: string) => path === "/history" || /^\/test\/(?!new)/.test(path) },
];

export function AppSidebar({ onOpenSettings }: AppSidebarProps) {
  const [mode, setMode] = useState<"demo" | "real">("demo");
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pb-5 pt-6">
        <button onClick={() => navigate("/")} className="text-left transition-opacity hover:opacity-90" aria-label="Usershoes home">
          <img src="/brand/usershoes-logo.png" alt="Usershoes" className={cn("h-auto object-contain", collapsed ? "w-10" : "w-[156px]")} />
        </button>
        {!collapsed && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Explore product ideas through simulated user perspectives.</p>}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {!collapsed && (
          <div className="px-2 pb-4">
            <div className="grid grid-cols-2 rounded-lg bg-subtle p-1" aria-label="Mode selection">
              <button onClick={() => setMode("demo")} className={cn("rounded-md px-2 py-1.5 text-xs font-semibold transition-colors", mode === "demo" && "bg-primary text-primary-foreground shadow-sm")} aria-pressed={mode === "demo"}>Demo</button>
              <button onClick={() => setMode("real")} className={cn("rounded-md px-2 py-1.5 text-xs font-semibold transition-colors", mode === "real" && "bg-primary text-primary-foreground shadow-sm")} aria-pressed={mode === "real"}>Real</button>
            </div>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = item.match(location.pathname);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} className={cn("rounded-lg transition-colors", active && "bg-primary/10 font-semibold text-primary hover:bg-primary/15")}>
                      <button onClick={() => navigate(item.url)} className="w-full">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-lg transition-colors">
                  <button onClick={onOpenSettings} className="w-full">
                    <SettingsIcon className="h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
