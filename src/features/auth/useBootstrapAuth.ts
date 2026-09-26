import { useEffect, useRef } from "react";
import { useAuthStore } from "./store";
import { getMe, loginUser } from "./api";

export const AUTO_LOGIN_EMAIL = "devasharjin@gmail.com";
export const AUTO_LOGIN_PASSWORD = "deva.420";

export function useBootstrapAuth() {
  const setLoading = useAuthStore((s) => s.setLoading);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const hasRunRef = useRef(false);

  useEffect(() => {
    if (useAuthStore.getState().isBootstrapped || hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    setLoading();

    const authenticate = async () => {
      // 1. Check if user is already logged in
      try {
        const me: any = await getMe();
        const existingUser = me?.user || me;
        if (existingUser && (existingUser._id || existingUser.email)) {
          setUser(existingUser);
          return;
        }
      } catch {
        // Not logged in or session expired
      }

      // 2. If not logged in, immediately send automatic login request to server
      try {
        const loginRes = await loginUser({
          email: AUTO_LOGIN_EMAIL,
          username: AUTO_LOGIN_EMAIL,
          password: AUTO_LOGIN_PASSWORD,
        });

        let userToSet = loginRes?.user;
        if (!userToSet || !userToSet._id) {
          try {
            const freshMe: any = await getMe();
            userToSet = freshMe?.user || freshMe;
          } catch {
            userToSet = loginRes;
          }
        }
        setUser(userToSet);
      } catch (loginErr) {
        console.error("Automatic login failed:", loginErr);
        clearAuth();
      }
    };

    // Safety timeout to prevent hanging on loader if API is unresponsive
    const timeoutId = setTimeout(() => {
      if (!useAuthStore.getState().isBootstrapped) {
        clearAuth();
      }
    }, 20000);

    authenticate().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [setLoading, setUser, clearAuth]);
}