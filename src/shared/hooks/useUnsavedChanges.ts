"use client";

import { useEffect, useCallback } from "react";

export interface UseUnsavedChangesOptions {
  isDirty: boolean;
  message?: string;
}

const DEFAULT_WARNING_MESSAGE = "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?";

/**
 * 🛡️ useUnsavedChanges
 * Empêche la perte accidentelle de données de formulaire en interceptant
 * les fermetures d'onglets / rafraîchissements (beforeunload) et les navigations.
 */
export function useUnsavedChanges({
  isDirty,
  message = DEFAULT_WARNING_MESSAGE,
}: UseUnsavedChangesOptions) {
  // Browser beforeunload handler (refresh, tab close, window close)
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, message]);

  // Method to safely prompt user before custom navigation/cancel actions
  const confirmNavigation = useCallback((): boolean => {
    if (!isDirty) return true;
    return window.confirm(message);
  }, [isDirty, message]);

  return { confirmNavigation };
}
