import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function useGuestAuth() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      // If user is admin, redirect to admin dashboard
      if (user && isAdmin) {
        navigate("/admin", { replace: true });
        return;
      }
    }
  }, [user, loading, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return {
    user,
    loading,
    isGuest: !!user && !isAdmin,
    signOut: handleSignOut,
  };
}
