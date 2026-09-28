import type { AppUser } from "@/lib/types";
import { create } from "zustand";

type AuthStore = {
  status: "idle" | "loading" | "ready" | "error";
  isBootstrapped: boolean;
  user: AppUser | null;
  error: string | null;

  setLoading: () => void;
  setUser: (user: AppUser | null) => void;
  setError: (message: string) => void;
  clearAuth: () => void;
};

const getInitialUser = (): AppUser | null => {
  try {
    const raw = localStorage.getItem("fairgig_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && (parsed._id || (parsed as any).id || parsed.email) ? parsed : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();

export const useAuthStore = create<AuthStore>((set) => ({
  status: initialUser ? "ready" : "idle",
  isBootstrapped: Boolean(initialUser),
  user: initialUser,
  error: null,

  setLoading: () =>
    set({
      status: "loading",
      error: null,
    }),

  setUser: (user) => {
    try {
      if (user && (user._id || (user as any).id || user.email)) {
        localStorage.setItem("fairgig_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("fairgig_user");
      }
    } catch {}

    set({
      status: "ready",
      isBootstrapped: true,
      user,
      error: null,
    });
  },

  setError: (message) =>
    set({
      status: "error",
      isBootstrapped: true,
      error: message,
    }),

  clearAuth: () => {
    try {
      localStorage.removeItem("fairgig_user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    } catch {}
    set({
      status: "ready",
      isBootstrapped: true,
      user: null,
      error: null,
    });
  },
}));