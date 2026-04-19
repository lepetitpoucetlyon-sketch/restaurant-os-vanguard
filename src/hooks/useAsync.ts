"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type AsyncStatus = "idle" | "loading" | "success" | "error";

interface UseAsyncOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    initialData?: T;
    resetOnExecute?: boolean;
}

interface UseAsyncReturn<T, Args extends unknown[]> {
    execute: (...args: Args) => Promise<T | undefined>;
    data: T | undefined;
    error: Error | null;
    status: AsyncStatus;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    reset: () => void;
}

/**
 * Hook pour gérer les opérations asynchrones avec états de loading, success, error.
 * 
 * @example
 * const { execute, isLoading, data, error } = useAsync(
 *   async (id: string) => await fetchReservation(id),
 *   { onSuccess: (data) => toast.success('Chargé !') }
 * );
 */
export function useAsync<T, Args extends unknown[] = []>(
    asyncFunction: (...args: Args) => Promise<T>,
    options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
    const { onSuccess, onError, initialData, resetOnExecute = false } = options;

    const [status, setStatus] = useState<AsyncStatus>("idle");
    const [data, setData] = useState<T | undefined>(initialData);
    const [error, setError] = useState<Error | null>(null);

    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const execute = useCallback(
        async (...args: Args): Promise<T | undefined> => {
            if (resetOnExecute) {
                setData(undefined);
                setError(null);
            }
            setStatus("loading");

            try {
                const result = await asyncFunction(...args);
                if (mountedRef.current) {
                    setData(result);
                    setStatus("success");
                    onSuccess?.(result);
                }
                return result;
            } catch (e) {
                const err = e instanceof Error ? e : new Error(String(e));
                if (mountedRef.current) {
                    setError(err);
                    setStatus("error");
                    onError?.(err);
                }
                return undefined;
            }
        },
        [asyncFunction, onSuccess, onError, resetOnExecute]
    );

    const reset = useCallback(() => {
        setStatus("idle");
        setData(initialData);
        setError(null);
    }, [initialData]);

    return {
        execute,
        data,
        error,
        status,
        isLoading: status === "loading",
        isSuccess: status === "success",
        isError: status === "error",
        reset,
    };
}
