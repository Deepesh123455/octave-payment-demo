import {
  LayoutDashboard,
  Store,
  Home,
  Zap,
  Wallet,
  CheckCircle,
  BarChart3,
  Sparkles,
  History as HistoryIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationCounts } from "@/hooks/apis/useNotificationQueries";
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
  { title: "Transactions", url: "/transactions", icon: HistoryIcon },
  { title: "Reports & Analytics", url: "/reports", icon: BarChart3 },
  { title: "AI Insights", url: "/ai-insights", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: countResponse } = useNotificationCounts();
  
  const counts = countResponse?.data || [];
  const getCount = (type: string) => counts.find((c: any) => c.type === type)?.count || 0;

  const sidebarNavItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Store Management", url: "/stores", icon: Store },
    { title: "Rent Payments", url: "/rent", icon: Home, count: getCount("RENT_DUE") },
    { title: "Utility Bills", url: "/utilities", icon: Zap, count: getCount("UTILITY_DUE") },
    { title: "Petty Cash", url: "/petty-cash", icon: Wallet, count: getCount("PETTY_CASH") },
    { title: "Approval Center", url: "/approvals", icon: CheckCircle, count: getCount("APPROVAL") },
    { title: "Transactions", url: "/transactions", icon: HistoryIcon, count: getCount("TRANSACTION") },
    { title: "Reports & Analytics", url: "/reports", icon: BarChart3 },
    { title: "AI Insights", url: "/ai-insights", icon: Sparkles },
  ];

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
              {sidebarNavItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url !== "/" && location.pathname.startsWith(item.url));
                const count = (item as any).count || 0;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      >
                        <div className="relative flex items-center gap-3 w-full">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-sm">{item.title}</span>
                              <AnimatePresence>
                                {count > 0 && (
                                  <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                  >
                                    <Badge 
                                      variant="destructive" 
                                      className="h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center rounded-full bg-primary animate-pulse border-0"
                                    >
                                      {count > 9 ? '9+' : count}
                                    </Badge>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                          {collapsed && count > 0 && (
                            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
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
