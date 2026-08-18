"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  getAuthServerState,
  getAuthState,
  login as doLogin,
  logout as doLogout,
  subscribeAuth,
} from "@/lib/auth";

interface AuthValue {
  /** Sudah selesai membaca status dari localStorage. */
  ready: boolean;
  authed: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { ready, authed } = useSyncExternalStore(
    subscribeAuth,
    getAuthState,
    getAuthServerState,
  );

  const login = useCallback(async (password: string) => doLogin(password), []);
  const logout = useCallback(() => doLogout(), []);

  const value = useMemo(
    () => ({ ready, authed, login, logout }),
    [ready, authed, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
