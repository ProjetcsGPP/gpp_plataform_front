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

  setUser: (user: MeResponse, appContext?: AppContext) => void;
  setAppContext: (ctx: AppContext) => void; // NOVO
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      ...initialState,

      setUser: (user, appContext) =>
        set(
          {
            user,
            appContext: appContext ?? null,
            isAuthenticated: true,
            isLoading: false,
          },
          false,
          "auth/setUser",
        ),

      // NOVO — permite atualizar o contexto ativo sem re-setar o usuário
      setAppContext: (ctx) =>
        set({ appContext: ctx }, false, "auth/setAppContext"),

      clearAuth: () => set(initialState, false, "auth/clearAuth"),

      setLoading: (isLoading) => set({ isLoading }, false, "auth/setLoading"),
    }),
    {
      name: "gpp-auth-store",
      enabled: process.env.NODE_ENV === "development",
      serialize: true,
    },
  ),
);
