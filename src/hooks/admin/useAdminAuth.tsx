import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function useAdminAuth() {
  const { user, loading, isAdmin, isSuperAdmin, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to login
      if (!user) {
        navigate("/admin/login", { replace: true });
        return;
      }

      // If authenticated but not admin, redirect to login with error
      if (!isAdmin) {
        navigate("/admin/login", { 
          replace: true, 
          state: { error: "You don't have permission to access the admin dashboard." }
        });
        return;
      }

      // If on login page and already authenticated as admin, redirect to dashboard
      if (location.pathname === "/admin/login") {
        navigate("/admin", { replace: true });
      }
    }
  }, [user, loading, isAdmin, navigate, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return {
    user,
    loading,
    isAdmin,
    isSuperAdmin,
    userRole,
    signOut: handleSignOut,
  };
}
