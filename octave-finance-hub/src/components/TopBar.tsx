import { Bell, Search, User, LogOut, AlertCircle, Clock, Check, Building2, Zap, Receipt, CheckCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStores } from "@/hooks/apis/useStoreQueries";
import { useNotifications, useMarkRead } from "@/hooks/apis/useNotificationQueries";

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: storeResponse } = useStores();
  const { data: notificationResponse } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const notifications = notificationResponse?.data || [];

  const stores = storeResponse?.data || [];
  
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return stores.filter(s => 
      s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.storeId.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5); // Limit to 5 results
  }, [stores, searchQuery]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "RENT_DUE": return <Building2 className="h-4 w-4 text-destructive" />;
      case "UTILITY_DUE": return <Zap className="h-4 w-4 text-accent" />;
      case "PETTY_CASH": return <Receipt className="h-4 w-4 text-success" />;
      case "APPROVAL": return <Check className="h-4 w-4 text-primary" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case "RENT_DUE": return "bg-destructive/10";
      case "UTILITY_DUE": return "bg-accent/10";
      case "PETTY_CASH": return "bg-success/10";
      case "APPROVAL": return "bg-primary/10";
      default: return "bg-secondary/10";
    }
  };

  const handleMarkAllRead = () => {
    if (notifications.length > 0) {
      markRead({ ids: notifications.map((n: any) => n.id) });
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stores..."
            className="pl-9 w-64 h-9 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
          />

          <AnimatePresence>
            {isSearchOpen && searchQuery.trim() !== "" && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSearchOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute top-11 left-0 w-80 bg-card border border-border shadow-2xl rounded-xl z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-border/50 bg-secondary/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Store Results</p>
                  </div>
                  <div className="p-1">
                    {searchResults.length > 0 ? (
                      searchResults.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            navigate(`/stores/${s.storeId}`);
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left group"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{s.storeName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{s.storeId} · {s.city}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No stores found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="p-2 bg-secondary/10 border-t border-border/50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full h-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                        onClick={() => {
                          navigate("/stores");
                          setIsSearchOpen(false);
                        }}
                      >
                        View All Stores
                      </Button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors group">
              <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              {notifications.length > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-foreground text-background border-0 animate-pulse">
                  {notifications.length}
                </Badge>
              )}
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
                {notifications.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="text-xs">No unread notifications</p>
                  </div>
                ) : (
                  notifications.map((n: any, idx: number) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 hover:bg-secondary/20 transition-colors border-b border-border/30 last:border-0 cursor-pointer group"
                      onClick={() => {
                        markRead({ ids: [n.id] });
                        // Optional: navigate based on type
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${getNotificationBg(n.type)}`}>
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-foreground">{n.title}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground font-bold italic tracking-tighter">
                              {n.store?.storeName || 'General'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="p-3 bg-secondary/10 border-t border-border/50 flex flex-col gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full h-8 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllRead}
              >
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
