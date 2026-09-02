'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { StockItem } from '../../types';
import { useStockPrediction } from '../../../../hooks/useStockPrediction';
import dynamic from 'next/dynamic';
import { Button } from "@/shared/components/ui/Button";
const OraclePredictor = dynamic(() => import('@/modules/intelligence').then(m => m.OraclePredictor), { ssr: false });

interface OracleModalProps {
    item: StockItem;
    onClose: () => void;
}

export function OracleModal({ item, onClose }: OracleModalProps) {
    const itemName = item.name ?? item.ingredientName ?? 'Article';
    const { prediction, loading } = useStockPrediction(item.id, item.quantity);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
            aria-hidden="true"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={`Prévision de stock — ${itemName}`}
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        {itemName} · {item.quantity} {item.unit}
                    </p>
                    <Button variant="ghost"
                        onClick={onClose}
                        aria-label="Fermer la prévision"
                        className="p-1 rounded hover:bg-surface-hover text-text-muted"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {loading && (
                    <div className="flex items-center justify-center h-48 text-text-muted text-sm">
                        Calcul de l'estimation en cours…
                    </div>
                )}

                {!loading && prediction && (
                    <OraclePredictor prediction={prediction} itemName={itemName} />
                )}
            </div>
        </div>
    );
}
