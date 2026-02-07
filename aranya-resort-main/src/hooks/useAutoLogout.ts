import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

interface UseAutoLogoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onLogout?: () => void;
  enabled?: boolean;
}

export function useAutoLogout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onWarning,
  onLogout,
  enabled = true,
}: UseAutoLogoutOptions = {}) {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    await signOut();
    onLogout?.();
  }, [signOut, onLogout, clearTimers]);

  const resetTimers = useCallback(() => {
    if (!enabled || !user) return;

    lastActivityRef.current = Date.now();
    clearTimers();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    // Set warning timer
    if (warningMinutes > 0 && warningMs > 0) {
      warningRef.current = setTimeout(() => {
        onWarning?.();
      }, warningMs);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [enabled, user, timeoutMinutes, warningMinutes, onWarning, handleLogout, clearTimers]);

  useEffect(() => {
    if (!enabled || !user) {
      clearTimers();
      return;
    }

    // Activity events to track
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttled reset function
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledReset = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        resetTimers();
      }, 1000);
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Initial timer setup
    resetTimers();

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        const elapsed = now - lastActivityRef.current;
        const timeoutMs = timeoutMinutes * 60 * 1000;
        
        if (elapsed >= timeoutMs) {
          handleLogout();
        } else {
          resetTimers();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimers();
      events.forEach((event) => {
        document.removeEventListener(event, throttledReset);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [enabled, user, resetTimers, handleLogout, clearTimers, timeoutMinutes]);

  return {
    resetTimers,
    remainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = timeoutMinutes * 60 * 1000 - elapsed;
      return Math.max(0, remaining);
    },
  };
}
