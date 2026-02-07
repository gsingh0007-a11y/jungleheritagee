import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/booking";
import { toast } from "@/hooks/use-toast";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: AppRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getRoleFlags(role: AppRole | null) {
  return {
    isAdmin: role === "super_admin" || role === "staff",
    isSuperAdmin: role === "super_admin",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  // Used to ignore stale role lookups when session changes.
  const roleFetchSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const fetchRole = async (userId: string) => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return (data?.role as AppRole) ?? null;
    };

    // Keep onAuthStateChange callback synchronous; defer any Supabase calls.
    const applySessionSync = (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      const userId = nextSession?.user?.id;
      if (!userId) {
        setUserRole(null);
        if (!cancelled) setLoading(false);
        return;
      }

      // Logged in: we must resolve role before considering auth “ready”.
      setUserRole(null);
      if (!cancelled) setLoading(true);

      const seq = ++roleFetchSeq.current;
      setTimeout(async () => {
        if (cancelled) return;
        try {
          const role = await fetchRole(userId);
          if (!cancelled && roleFetchSeq.current === seq) setUserRole(role);
        } catch (err: any) {
          if (!cancelled && roleFetchSeq.current === seq) setUserRole(null);
          toast({
            variant: "destructive",
            title: "Role lookup failed",
            description: err?.message || "Could not fetch user role.",
          });
        } finally {
          if (!cancelled && roleFetchSeq.current === seq) setLoading(false);
        }
      }, 0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySessionSync(nextSession);
    });

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      applySessionSync(existingSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    let lastError: any = null;

    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        lastError = error;
        await supabase.auth.signOut({ scope: "local" });
      }
    } catch (err: any) {
      lastError = err;
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (err2: any) {
        lastError = err2;
      }
    } finally {
      // Failsafe: clear persisted Supabase auth tokens.
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") && k.includes("auth-token"))
          .forEach((k) => localStorage.removeItem(k));
      } catch {
        // ignore
      }

      setSession(null);
      setUser(null);
      setUserRole(null);
      setLoading(false);
    }

    if (lastError) {
      toast({
        variant: "destructive",
        title: "Sign out issue",
        description: lastError?.message || "Signed out locally, but server revoke failed.",
      });
    }
  };

  const flags = getRoleFlags(userRole);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRole,
        isAdmin: flags.isAdmin,
        isSuperAdmin: flags.isSuperAdmin,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
