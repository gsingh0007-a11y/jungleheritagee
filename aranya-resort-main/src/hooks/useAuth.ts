import { useAuthContext } from "@/contexts/AuthContext";

// Backwards-compatible hook used across the app.
// Auth state is centralized in <AuthProvider /> to avoid multiple listeners.
export function useAuth() {
  return useAuthContext();
}
