'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PlatformVariant } from '@/modules/system';
import { VERTICAL_META } from '@/modules/system';
import { TierRow } from './TierRow';
import { PromotionModal } from './PromotionModal';
import type { TierInfo } from './TierRow';
import { Button } from "@/shared/components/ui/Button";

export function VariantCard({ variant, tierConfig }: {
    variant: PlatformVariant;
    tierConfig: TierInfo[];
}) {
    const [collapsed, setCollapsed]       = useState(false);
    const [showPromote, setShowPromote]   = useState(false);
    const [promoteCount, setPromoteCount] = useState(0);
    const meta = VERTICAL_META[variant];

    return (
        <>
            <div className="border border-default rounded-2xl overflow-hidden">
                {/* Header */}
                <Button variant="ghost"
                    onClick={() => setCollapsed(c => !c)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-surface-card hover:bg-surface-glass transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{meta.emoji}</span>
                        <span className="font-bold uppercase tracking-widest text-sm text-text-primary">
                            {meta.label}
                        </span>
                        <span className="text-xs font-mono text-muted">× 3 tiers</span>
                    </div>
                    {collapsed
                        ? <ChevronDown className="w-4 h-4 text-muted" />
                        : <ChevronUp className="w-4 h-4 text-muted" />
                    }
                </Button>

                {/* Tier rows */}
                {!collapsed && (
                    <div className="px-4 py-3 space-y-2 bg-surface-bg/30">
                        {tierConfig.map(tierCfg => (
                            <TierRow
                                key={tierCfg.tier}
                                variant={variant}
                                tierCfg={tierCfg}
                                onPromote={() => setShowPromote(true)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Promotion Modal */}
            <AnimatePresence>
                {showPromote && (
                    <PromotionModal
                        key={`promote-${variant}-${promoteCount}`}
                        variant={variant}
                        onClose={() => setShowPromote(false)}
                        onSuccess={() => setPromoteCount(c => c + 1)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
