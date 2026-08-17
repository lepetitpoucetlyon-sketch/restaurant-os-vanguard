'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import type { PlatformVariant } from '@/modules/system';
import { getSystemTenantId } from '@/lib/mcc/SystemTenantRegistry';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';
import { toError } from "@/lib/toError";

const CLONABLE_COLLECTIONS = ['categories', 'products', 'floors', 'zones', 'tables', 'connectors'];

export function PromotionModal({
    variant,
    onClose,
    onSuccess,
}: {
    variant: PlatformVariant;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set(CLONABLE_COLLECTIONS));
    const [loading, setLoading]   = useState(false);
    const testId = getSystemTenantId(variant, 'TEST');
    const refId  = getSystemTenantId(variant, 'REFERENCE');

    const toggle = (col: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(col)) next.delete(col); else next.add(col);
            return next;
        });
    };

    const promote = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authedFetch('/api/admin/mcc/system-tenants/promote', {
                method: 'POST',
                body: JSON.stringify({ variant, collections: Array.from(selected) }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success(`REFERENCE ${variant} mise à jour ✓`);
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(`Erreur promotion : ${toError(err).message}`);
        } finally {
            setLoading(false);
        }
    }, [variant, selected, onSuccess, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full max-w-lg mx-4 bg-surface-sidebar border border-default rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-text-primary">
                        Promouvoir TEST → REFERENCE
                    </h3>
                    <button onClick={onClose} className="text-muted hover:text-text-primary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-sm text-muted mb-5">
                    <span className="font-mono text-blue-400">{testId}</span>
                    {' → '}
                    <span className="font-mono text-brand">{refId}</span>
                </p>

                <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Collections à copier</p>
                <div className="space-y-2 mb-6">
                    {CLONABLE_COLLECTIONS.map(col => (
                        <label key={col} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selected.has(col)}
                                onChange={() => toggle(col)}
                                className="w-4 h-4 rounded accent-brand"
                            />
                            <span className="text-sm font-mono text-text-primary group-hover:text-brand transition-colors">
                                {col}
                            </span>
                        </label>
                    ))}
                    <div className="pt-2 border-t border-default">
                        <p className="text-xs text-muted">
                            <span className="line-through opacity-40">fiscalSeals</span>
                            <span className="ml-2 text-red-400/70">JAMAIS cloné — NF525</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-default text-sm font-bold text-muted hover:text-text-primary transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={promote}
                        disabled={loading || selected.size === 0}
                        className="flex-1 px-4 py-3 rounded-xl bg-brand text-primary text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Snapshot + Promouvoir
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
