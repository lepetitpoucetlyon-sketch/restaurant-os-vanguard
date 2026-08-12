'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { PremiumSelect } from '@ui/PremiumSelect';
import type { QuoteLine } from '../../../types';

interface QuoteLineRowProps {
    line: Partial<QuoteLine>;
    onUpdate: (id: string, updates: Partial<QuoteLine>) => void;
    onRemove: (id: string) => void;
}

export function QuoteLineRow({ line, onUpdate, onRemove }: QuoteLineRowProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-[1fr,100px,140px,100px,140px,60px] p-6 items-center group"
        >
            <input
                value={line.designation}
                onChange={(e) => onUpdate(line.id!, { designation: e.target.value })}
                placeholder="Saisir la prestation..."
                className="bg-transparent text-sm text-text-primary outline-none font-medium placeholder:text-text-muted/20"
            />
            <div className="flex justify-center">
                <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => onUpdate(line.id!, { quantity: parseFloat(e.target.value) || 0 })}
                    className="w-16 h-10 bg-bg-tertiary border border-border rounded-xl text-center text-sm font-mono text-text-primary focus:border-accent-gold transition-all shadow-inner"
                />
            </div>
            <div className="flex justify-center">
                <input
                    type="number"
                    value={line.unitPriceHTInMicrounits ? (line.unitPriceHTInMicrounits / 1_000_000) : 0}
                    onChange={(e) => onUpdate(line.id!, { unitPriceHTInMicrounits: Math.round(parseFloat(e.target.value) * 1_000_000) || 0 })}
                    className="w-24 h-10 bg-bg-tertiary border border-border rounded-xl text-center text-sm font-mono text-accent focus:border-accent-gold transition-all shadow-inner"
                />
            </div>
            <div className="flex justify-center w-full">
                <PremiumSelect
                    value={line.vatRate?.toString() || "20"}
                    onChange={(val) => onUpdate(line.id!, { vatRate: parseFloat(val) })}
                    options={[
                        { value: '20', label: '20%' },
                        { value: '10', label: '10%' },
                        { value: '5.5', label: '5.5%' }
                    ]}
                    className="w-24 mt-0 space-y-0"
                />
            </div>
            <div className="text-right text-sm font-mono font-black text-text-primary tracking-tighter">
                {((line.totalTTCInMicrounits || 0) / 1_000_000).toFixed(2)}€
            </div>
            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onRemove(line.id!)}
                    className="p-3 text-text-muted hover:text-error transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
