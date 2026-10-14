"use client";

import { create } from "zustand";

export interface PatriarcaSelection {
  idpatriarca: number;
  strsiglapatriarca: string;
  strnome: string;
}

interface PatriarcaSelectionState {
  selected: PatriarcaSelection | null;
  selectedForUserId: number | null;
  selectForUser: (userId: number, patriarca: PatriarcaSelection) => void;
  clear: () => void;
}

export const usePatriarcaSelectionStore = create<PatriarcaSelectionState>()(
  (set) => ({
    selected: null,
    selectedForUserId: null,
    selectForUser: (userId, patriarca) =>
      set({ selected: patriarca, selectedForUserId: userId }),
    clear: () => set({ selected: null, selectedForUserId: null }),
  }),
);
