import { Bell, LogOut, Menu, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { AppRole } from "@/types/booking";
import logoImage from "@/assets/logo.png";

const PHONE_NUMBER = "9250225752";

interface AdminHeaderProps {
  user: SupabaseUser | null;
  userRole: AppRole | null;
  onSignOut: () => void;
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
  isMobile?: boolean;
  pendingCount?: number;
}

export function AdminHeader({ 
  user, 
  userRole, 
  onSignOut, 
  onMenuToggle,
  sidebarCollapsed,
  isMobile = false,
  pendingCount = 0
}: AdminHeaderProps) {
  const roleLabel = userRole === 'super_admin' ? 'Owner' : 'Staff';
  const userEmail = user?.email || 'Admin';
  const userName = user?.user_metadata?.full_name || userEmail.split('@')[0];

  return (
    <header className={cn(
      "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 transition-all duration-300",
      isMobile ? "left-0" : (sidebarCollapsed ? "left-16" : "left-64")
    )}>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden md:block">
          <h2 className="text-sm font-medium text-foreground">Welcome back,</h2>
          <p className="text-xs text-muted-foreground">{userName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Phone Number */}
        <a 
          href={`tel:+91${PHONE_NUMBER}`}
          className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="h-4 w-4" />
          <span>+91 {PHONE_NUMBER}</span>
        </a>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                  {roleLabel}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
