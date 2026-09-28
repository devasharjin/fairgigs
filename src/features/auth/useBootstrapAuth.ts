import { useEffect, useRef } from "react";
import { useAuthStore } from "./store";
import { getMe, loginUser } from "./api";

export const AUTO_LOGIN_EMAIL = "devasharjin@gmail.com";
export const AUTO_LOGIN_PASSWORD = "deva.420";

export function useBootstrapAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    const authenticate = async () => {
      // 1. Silent verify: Check if user is already logged in via httpOnly cookie or active session
      try {
        const me: any = await getMe();
        const existingUser = me?.user || me;
        if (existingUser && (existingUser._id || existingUser.id || existingUser.email)) {
          setUser(existingUser);
          return;
        }
      } catch {
        // Not logged in or session expired
      }

      // 2. If no valid session and no cached user, perform fast auto-login
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        try {
          const loginRes: any = await loginUser({
            email: AUTO_LOGIN_EMAIL,
            username: AUTO_LOGIN_EMAIL,
            password: AUTO_LOGIN_PASSWORD,
          });

          const userToSet = loginRes?.user || loginRes?.data?.user || loginRes;
          if (userToSet && (userToSet._id || userToSet.id || userToSet.email)) {
            setUser(userToSet);
            return;
          }
        } catch (loginErr) {
          console.warn("Auto-login fallback error:", loginErr);
        }
      }

      // 3. Fallback resolution: If we had a stale user that failed verification, clear it;
      // otherwise ensure isBootstrapped is true so the page displays immediately.
      if (currentUser) {
        clearAuth();
      } else {
        useAuthStore.setState({ isBootstrapped: true, status: "ready" });
      }
    };

    // Fast safety timeout (4s instead of 20s) so the app NEVER hangs on a blank/spinner screen
    const timeoutId = setTimeout(() => {
      if (!useAuthStore.getState().isBootstrapped) {
        useAuthStore.setState({ isBootstrapped: true, status: "ready" });
      }
    }, 4000);

    authenticate().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [setUser, clearAuth]);
}