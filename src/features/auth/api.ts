import { apiGet, apiPost } from "@/lib/api";
import type {
  CustomerRegisterPayload,
  WorkerRegisterPayload,
  CooperativeRegisterPayload,
  LoginPayload,
  MeResponse,
} from "./types";

export async function loginUser(payload: LoginPayload) {
  const res = await apiPost<any, LoginPayload>("/api/auth/login", payload);
  const token = res?.accessToken || res?.tokens?.accessToken;
  const refreshToken = res?.refreshToken || res?.tokens?.refreshToken;
  if (token) {
    try {
      localStorage.setItem("auth_token", token);
    } catch {}
  }
  if (refreshToken) {
    try {
      localStorage.setItem("refresh_token", refreshToken);
    } catch {}
  }
  return { ...res, user: res?.user || res };
}

export async function getMe(): Promise<MeResponse> {
  const res = await apiGet<any>("/api/auth/me");
  if (res?.user) {
    return { ...res.user, ...res };
  }
  return res;
}

export async function logout() {
  try {
    await apiPost<any>("/api/auth/logout");
  } finally {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    } catch {}
  }
}

export const customerRegister = async (payload: CustomerRegisterPayload) => {
  const res = await apiPost<any, CustomerRegisterPayload>("/api/auth/register/customer", payload);
  return res;
};

export const workerRegister = async (payload: WorkerRegisterPayload | FormData) => {
  const res = await apiPost<any, WorkerRegisterPayload | FormData>("/api/auth/register/worker", payload);
  return res;
};

export const cooperativeRegister = async (payload: CooperativeRegisterPayload | FormData) => {
  const res = await apiPost<any, CooperativeRegisterPayload | FormData>("/api/auth/register/cooperative", payload);
  return res;
};

export const getCooperatives = async () => {
  const res = await apiGet<any>("/api/auth/cooperatives");
  return (res?.data || res || []) as import("./types").CooperativeOption[];
};
