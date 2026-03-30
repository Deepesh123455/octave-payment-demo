import { Bell, Search, User, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export function TopBar() {
  const { user, logout, isAdmin } = useAuth();

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
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-foreground text-background border-0">
            5
          </Badge>
        </button>
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
