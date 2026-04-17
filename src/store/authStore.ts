// src/store/authStore.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AppContext, MeResponse } from "@/types/auth";

const initialState = {
  user: null,
  appContext: null,
  isAuthenticated: false,
  isLoading: false,
};

interface AuthState {
  user: MeResponse | null;
  appContext: AppContext | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: MeResponse, appContext: AppContext) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      ...initialState,

      setUser: (user, appContext) =>
        set(
          { user, appContext, isAuthenticated: true, isLoading: false },
          false,
          "auth/setUser",
        ),

      clearAuth: () => set(initialState, false, "auth/clearAuth"),

      setLoading: (isLoading) =>
        set({ isLoading: isLoading }, false, "auth/setLoading"),
    }),
    {
      name: "gpp-auth-store",
      enabled: process.env.NODE_ENV === "development",
      serialize: true,
    },
  ),
);
