import { Bell, Search, User, LogOut, AlertCircle, Clock, Check, Building2, Zap, Receipt } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

export function TopBar() {
  const { user, logout, isAdmin } = useAuth();

  const notifications = [
    {
      id: "1",
      title: "Rent Overdue",
      message: "Monthly rent for STO001 High Street is 3 days overdue.",
      time: "2h ago",
      type: "overdue",
      amount: "₹45,000",
      icon: <Building2 className="h-4 w-4 text-destructive" />,
    },
    {
      id: "2",
      title: "Utility Bill Due",
      message: "Electricity bill for Mall Store STO005 is due in 2 days.",
      time: "5h ago",
      type: "upcoming",
      amount: "₹12,400",
      icon: <Zap className="h-4 w-4 text-accent" />,
    },
    {
      id: "3",
      title: "Petty Cash Request",
      message: "New request from Manager John for Store Supplies.",
      time: "1d ago",
      type: "action",
      amount: "₹2,500",
      icon: <Receipt className="h-4 w-4 text-success" />,
    },
    {
      id: "4",
      title: "Rent Upcoming",
      message: "Next month rent for STO002 is scheduled for generation.",
      time: "2d ago",
      type: "info",
      amount: "₹60,000",
      icon: <Clock className="h-4 w-4 text-primary" />,
    },
  ];

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stores, invoices..."
            className="pl-9 w-64 h-9 bg-secondary border-0"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors group">
              <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-foreground text-background border-0 animate-pulse">
                {notifications.length}
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-2xl border-border/50 overflow-hidden rounded-xl" align="end">
            <div className="p-4 bg-secondary/30 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">Notifications</h4>
                <Badge variant="outline" className="text-[10px] font-bold bg-background/50 border-border/50">
                  {notifications.length} NEW
                </Badge>
              </div>
            </div>
            <ScrollArea className="h-[350px]">
              <div className="flex flex-col">
                {notifications.map((n, idx) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 hover:bg-secondary/20 transition-colors border-b border-border/30 last:border-0 cursor-pointer group"
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        n.type === 'overdue' ? 'bg-destructive/10' : 
                        n.type === 'upcoming' ? 'bg-accent/10' : 
                        n.type === 'action' ? 'bg-success/10' : 'bg-primary/10'
                      }`}>
                        {n.icon}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold leading-none ${
                            n.type === 'overdue' ? 'text-destructive' : 'text-foreground'
                          }`}>{n.title}</p>
                          <span className="text-[10px] text-muted-foreground">{n.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground font-bold italic tracking-tighter">
                            {n.amount}
                          </span>
                          {n.type === 'overdue' && (
                            <span className="text-[9px] text-destructive font-black uppercase tracking-widest animate-pulse">
                              Immediate Action!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-3 bg-secondary/10 border-t border-border/50 flex flex-col gap-2">
              <Button size="sm" variant="ghost" className="w-full h-8 text-[11px] font-bold text-muted-foreground hover:text-foreground">
                <Check className="h-3 w-3 mr-2" /> Mark all as read
              </Button>
              <Button size="sm" className="w-full h-9 text-xs font-bold shadow-lg shadow-primary/10 group">
                Read More Notifications
                <motion.span 
                  animate={{ x: [0, 5, 0] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Search className="h-3 w-3 ml-2" />
                </motion.span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center">
            <User className="h-4 w-4 text-background" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">{user?.email || "User"}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-tighter mt-1">
              {user?.role?.replace("_", " ") || "No Role Assigned"}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
