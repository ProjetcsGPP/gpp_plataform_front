"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { usePatriarcaSelectionStore } from "@/store/patriarcaSelectionStore";

const LEGACY_STORAGE_KEY = "carga-org-lot-patriarca-selection";

export function usePatriarcaSelection() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const storedSelection = usePatriarcaSelectionStore((state) => state.selected);
  const selectedForUserId = usePatriarcaSelectionStore(
    (state) => state.selectedForUserId,
  );
  const selectForUser = usePatriarcaSelectionStore(
    (state) => state.selectForUser,
  );
  const clearSelection = usePatriarcaSelectionStore((state) => state.clear);

  useEffect(() => {
    // Remove escolhas gravadas pela versão anterior. O contexto atual é
    // deliberadamente efêmero e nunca deve sobreviver a uma nova sessão.
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, []);

  return {
    userId,
    selected:
      userId && selectedForUserId === userId ? storedSelection : null,
    select: (patriarca: {
      idpatriarca: number;
      strsiglapatriarca: string;
      strnome: string;
    }) => {
      if (userId) selectForUser(userId, patriarca);
    },
    clear: () => {
      clearSelection();
    },
  };
}
