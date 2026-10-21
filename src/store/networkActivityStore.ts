import { create } from "zustand";

interface NetworkActivityState {
  pendingRequests: number;
  beginRequest: () => void;
  endRequest: () => void;
}

export const useNetworkActivityStore = create<NetworkActivityState>((set) => ({
  pendingRequests: 0,
  beginRequest: () =>
    set((state) => ({ pendingRequests: state.pendingRequests + 1 })),
  endRequest: () =>
    set((state) => ({
      pendingRequests: Math.max(0, state.pendingRequests - 1),
    })),
}));
