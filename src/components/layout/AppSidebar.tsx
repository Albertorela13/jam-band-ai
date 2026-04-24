import { History, Settings as SettingsIcon, Users } from "lucide-react";
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

/**
 * AskUsers brand mark — a smiling speech-bubble face with five colored
 * "spark" rays above it. Pure inline SVG, palette tokens only.
 */
function AskUsersMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={className}
    >
      {/* Spark rays — left to right: brick, coral, mustard, olive, ochre */}
      <g strokeWidth="1.8" strokeLinecap="round">
        <line x1="9.5" y1="6.5" x2="8" y2="3.5" stroke="hsl(var(--destructive))" />
        <line x1="14" y1="4.5" x2="13.2" y2="1.2" stroke="hsl(var(--secondary))" />
        <line x1="20" y1="4" x2="20" y2="0.8" stroke="hsl(var(--primary))" />
        <line x1="26" y1="4.5" x2="26.8" y2="1.2" stroke="hsl(var(--success))" />
        <line x1="30.5" y1="6.5" x2="32" y2="3.5" stroke="hsl(var(--warning))" />
      </g>

      {/* Speech bubble */}
      <path
        d="M8 14
           Q8 9 13 9
           H27
           Q32 9 32 14
           V24
           Q32 29 27 29
           H17
           L12 34
           L13 29
           Q8 29 8 24
           Z"
        fill="hsl(var(--background))"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Smiling eyes */}
      <path d="M14.5 17 q1.5 1.8 3 0" stroke="hsl(var(--foreground))" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M22.5 17 q1.5 1.8 3 0" stroke="hsl(var(--foreground))" strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* Open smile */}
      <path
        d="M16 21 Q20 26 24 21 Z"
        fill="hsl(var(--foreground))"
      />
    </svg>
  );
}

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
          aria-label="AskUsers — go to Panel"
        >
          <AskUsersMark className="h-9 w-9 shrink-0" />
          {!collapsed && (
            <span className="font-display text-xl font-semibold leading-none tracking-tight">
              <span className="text-foreground">ASK</span>
              <span className="text-primary">USERS</span>
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
            Stress-test features against your users.
          </p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
