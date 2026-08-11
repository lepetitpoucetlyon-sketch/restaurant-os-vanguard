"use client";

import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { themeModeAtom } from "@/store/themeAtoms";

/**
 * ThemeApplicator — applique data-theme sur <html> selon l'état Jotai.
 *
 * - "light"  → data-theme="light"
 * - "dark"   → data-theme="dark"
 * - "auto"   → supprime data-theme (laisse prefers-color-scheme décider)
 *
 * À monter dans le root layout (client boundary).
 * Aucun rendu HTML — effet uniquement.
 */
export function ThemeApplicator() {
    const mode = useAtomValue(themeModeAtom);

    useEffect(() => {
        const root = document.documentElement;
        if (mode === "auto") {
            root.removeAttribute("data-theme");
        } else {
            root.setAttribute("data-theme", mode);
        }
    }, [mode]);

    return null;
}
