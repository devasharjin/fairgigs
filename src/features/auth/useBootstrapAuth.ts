import { useEffect, useRef } from "react";
import { useAuthStore } from "./store";
import { getMe, loginUser } from "./api";

export const AUTO_LOGIN_EMAIL = "devasharjin@gmail.com";
export const AUTO_LOGIN_PASSWORD = "deva.420";

// Eager kick-off so network latency starts during initial script evaluation
let eagerLoginPromise: Promise<any> | null = null;
if (
  typeof window !== "undefined" &&
  !localStorage.getItem("auth_token")
) {
  eagerLoginPromise = loginUser({
    email: AUTO_LOGIN_EMAIL,
    username: AUTO_LOGIN_EMAIL,
    password: AUTO_LOGIN_PASSWORD,
  }).catch((err) => {
    console.debug("Eager auto-login deferred:", err);
    return null;
  });
}

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
      const storedToken = localStorage.getItem("auth_token");
      const currentUser = useAuthStore.getState().user;

      // 1. Instant path: Token and user already cached in localStorage -> zero wait time
      if (storedToken && currentUser) {
        useAuthStore.setState({ isBootstrapped: true, status: "ready" });

        // Non-blocking background verification (revalidate quietly)
        getMe()
          .then((me: any) => {
            const existingUser = me?.user || me;
            if (existingUser && (existingUser._id || existingUser.id || existingUser.email)) {
              setUser(existingUser);
            }
          })
          .catch(() => {
            // Token expired or invalid: auto-login immediately
            loginUser({
              email: AUTO_LOGIN_EMAIL,
              username: AUTO_LOGIN_EMAIL,
              password: AUTO_LOGIN_PASSWORD,
            })
              .then((res: any) => {
                const u = res?.user || res?.data?.user || res;
                if (u && (u._id || u.id || u.email)) {
                  setUser(u);
                }
              })
              .catch(() => clearAuth());
          });
        return;
      }

      // 2. Fast auto-login path: No stored session -> directly execute auto-login (skip doomed getMe)
      try {
        const loginRes: any = eagerLoginPromise
          ? await eagerLoginPromise
          : await loginUser({
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
        console.warn("Fast auto-login error:", loginErr);
      }

      // 3. Complete bootstrap immediately so page displays without hanging
      useAuthStore.setState({ isBootstrapped: true, status: "ready" });
    };

    // Fast safety timeout: 1.5s max to guarantee no blank/spinner hangs
    const timeoutId = setTimeout(() => {
      if (!useAuthStore.getState().isBootstrapped) {
        useAuthStore.setState({ isBootstrapped: true, status: "ready" });
      }
    }, 1500);

    authenticate().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [setUser, clearAuth]);
}