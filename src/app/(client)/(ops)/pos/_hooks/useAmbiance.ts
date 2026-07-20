"use client";

import { useState, useEffect } from "react";
import { AmbianceService, RestaurantAmbiance } from "@domain/services/AmbianceService";

export function useAmbiance() {
    const [ambiance, setAmbiance] = useState<RestaurantAmbiance>(AmbianceService.getCurrentAmbiance());
    const [tokens, setTokens] = useState(AmbianceService.getThemeTokens());

    useEffect(() => {
        const handleAmbianceChange = () => {
            setAmbiance(AmbianceService.getCurrentAmbiance());
            setTokens(AmbianceService.getThemeTokens());
        };
        window.addEventListener("ambiance-changed", handleAmbianceChange);
        return () => window.removeEventListener("ambiance-changed", handleAmbianceChange);
    }, []);

    return { ambiance, tokens };
}
