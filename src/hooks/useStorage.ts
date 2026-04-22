"use client";

import { useState, useCallback } from "react";

/**
 * Hook pour persister des valeurs dans le localStorage.
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {}
        },
        [key, storedValue]
    );

    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(key);
            }
        } catch (error) {}
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

/**
 * Hook pour persister des valeurs dans sessionStorage.
 */
export function useSessionStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                if (typeof window !== "undefined") {
                    window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {}
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
}
