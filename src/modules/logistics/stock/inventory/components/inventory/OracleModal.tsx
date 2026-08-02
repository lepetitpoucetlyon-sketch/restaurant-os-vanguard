'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { StockItem } from '@modules/logistics/stock/inventory/types';
import { useStockPrediction } from '@/modules/logistics';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { OraclePredictor } from '@/modules/intelligence';

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
        >
            <div
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        {itemName} · {item.quantity} {item.unit}
                    </p>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-surface-hover text-text-muted"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {loading && (
                    <div className="flex items-center justify-center h-48 text-text-muted text-sm">
                        Analyse Monte-Carlo en cours…
                    </div>
                )}

                {!loading && prediction && (
                    <OraclePredictor prediction={prediction} itemName={itemName} />
                )}
            </div>
        </div>
    );
}
