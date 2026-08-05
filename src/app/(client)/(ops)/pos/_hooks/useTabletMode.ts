"use client";

import { useState, useEffect } from "react";
import { tenantScopedKey } from "@/lib/storage/tenantScopedKey";

export function useTabletMode() {
    const [isTabletMode, setIsTabletMode] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(tenantScopedKey("pos-tablet-mode")) === "true";
    });
    const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(tenantScopedKey("pos-tablet-mode"), String(isTabletMode));
    }, [isTabletMode]);

    return { isTabletMode, setIsTabletMode, isTablePickerOpen, setIsTablePickerOpen };
}
