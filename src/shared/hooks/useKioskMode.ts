"use client";

import { useState, useEffect } from "react";

export function useKioskMode(): { isKiosk: boolean; toggleKiosk: (enabled?: boolean) => void } {
  const [isKiosk, setIsKiosk] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkKiosk = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlKiosk = urlParams.get("kiosk") === "1" || urlParams.get("kiosk") === "true";
      const storedKiosk = localStorage.getItem("nexus_kiosk_mode") === "true";
      const attrKiosk = document.documentElement.getAttribute("data-layout") === "kiosk";

      const active = urlKiosk || storedKiosk || attrKiosk;
      setIsKiosk(active);

      if (active) {
        document.documentElement.setAttribute("data-layout", "kiosk");
      } else {
        document.documentElement.removeAttribute("data-layout");
      }
    };

    checkKiosk();
  }, []);

  const toggleKiosk = (enabled?: boolean) => {
    const next = enabled !== undefined ? enabled : !isKiosk;
    setIsKiosk(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_kiosk_mode", String(next));
      if (next) {
        document.documentElement.setAttribute("data-layout", "kiosk");
      } else {
        document.documentElement.removeAttribute("data-layout");
      }
    }
  };

  return { isKiosk, toggleKiosk };
}
