import {
  LayoutDashboard,
  Store,
  Home,
  Zap,
  Wallet,
  CheckCircle,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Store Management", url: "/stores", icon: Store },
  { title: "Rent Payments", url: "/rent", icon: Home },
  { title: "Utility Bills", url: "/utilities", icon: Zap },
  { title: "Petty Cash", url: "/petty-cash", icon: Wallet },
  { title: "Approval Center", url: "/approvals", icon: CheckCircle },
  { title: "Reports & Analytics", url: "/reports", icon: BarChart3 },
  { title: "AI Insights", url: "/ai-insights", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className={`px-5 py-6 ${collapsed ? "px-2" : ""}`}>
          {!collapsed ? (
            <div>
              <img src="/OctaveLogo_510x.jpg" alt="OCTAVE" className="h-6 w-auto object-contain" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-sidebar-foreground mt-1">
                Mettle · Finance
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <img src="/OctaveLogo_510x.jpg" alt="O" className="h-4 w-auto object-contain" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url !== "/" && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
