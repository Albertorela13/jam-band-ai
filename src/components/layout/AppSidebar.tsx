import { History, Music2, Settings as SettingsIcon, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  onOpenSettings: () => void;
}

const navItems = [
  { title: "Panel", url: "/", icon: Users, match: (p: string) => p === "/" || p.startsWith("/persona") || p === "/test/new" },
  { title: "History", url: "/history", icon: History, match: (p: string) => p === "/history" || /^\/test\/(?!new)/.test(p) },
];

export function AppSidebar({ onOpenSettings }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pt-5 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-left transition-transform duration-200 ease-bounce hover:scale-[1.02]"
          aria-label="Jam Session — go to Panel"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-warm">
            <Music2 className="h-4 w-4" strokeWidth={2.5} />
          </span>
          {!collapsed && (
            <span className="font-display text-xl font-bold italic leading-none tracking-tight">
              Jam <span className="text-secondary">Session</span>
            </span>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = item.match(location.pathname);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "rounded-lg transition-colors",
                        active && "bg-primary/15 text-foreground font-medium hover:bg-primary/20",
                      )}
                    >
                      <button onClick={() => navigate(item.url)} className="w-full">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="rounded-lg transition-colors"
                >
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

      {!collapsed && (
        <SidebarFooter className="px-4 pb-5 pt-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Stress-test features against your personas.
          </p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
