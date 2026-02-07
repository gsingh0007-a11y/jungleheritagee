import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function AdminLayout() {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading, isAdmin, isSuperAdmin, userRole, signOut } = useAdminAuth();


  // Auto-collapse sidebar on mobile
  const effectiveCollapsed = isMobile ? true : sidebarCollapsed;
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Auto logout after 30 minutes of inactivity for admin
  useAutoLogout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    enabled: !!user && isAdmin,
    onWarning: () => {
      toast({
        title: "Session expiring soon",
        description: "You'll be logged out in 5 minutes due to inactivity.",
        variant: "destructive",
      });
    },
    onLogout: () => {
      toast({
        title: "Session expired",
        description: "You've been logged out due to inactivity.",
      });
      navigate("/admin/login", { replace: true });
    },
  });

  // Get pending bookings count for notification badge
  const { data: pendingCount } = useQuery({
    queryKey: ["admin", "pendingCount"],
    queryFn: async () => {
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "new_enquiry");
      return count || 0;
    },
    enabled: isAdmin,
    refetchInterval: 60000, // Refetch every minute
  });

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not admin, the useAdminAuth hook will redirect
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        collapsed={effectiveCollapsed}
        onToggle={toggleSidebar}
        isSuperAdmin={isSuperAdmin}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Header */}
      <AdminHeader
        user={user}
        userRole={userRole}
        onSignOut={signOut}
        onMenuToggle={toggleSidebar}
        sidebarCollapsed={effectiveCollapsed}
        isMobile={isMobile}
        pendingCount={pendingCount}
      />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          isMobile ? "pl-0" : (effectiveCollapsed ? "pl-16" : "pl-64")
        )}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
