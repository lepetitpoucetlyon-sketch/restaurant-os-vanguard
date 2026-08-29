"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface ScannableProduct {
    id: string;
    name: string;
    barcode?: string;
    sku?: string;
}

export function useBarcodeScanner(
    products: ScannableProduct[] | undefined,
    onAddToCart: (product: never, quantity: number, options: Record<string, unknown>) => void
) {
    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA") && !target.dataset.scanner) {
                return;
            }

            const now = Date.now();
            if (now - lastKeyTime > 100) buffer = "";
            lastKeyTime = now;

            if (e.key === "Enter") {
                if (buffer.length >= 3) {
                    const scannedCode = buffer.trim().toLowerCase();
                    const found = products?.find((p) =>
                        (p.barcode && p.barcode.toLowerCase() === scannedCode) ||
                        (p.sku && p.sku.toLowerCase() === scannedCode) ||
                        p.id.toLowerCase() === scannedCode
                    );

                    if (found) {
                        onAddToCart(found as never, 1, {});
                        toast.success(`Article scanné : ${found.name}`);
                    } else {
                        toast.warning(`Aucun article trouvé pour le code ${scannedCode}`);
                    }
                    buffer = "";
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [products, onAddToCart]);
}
