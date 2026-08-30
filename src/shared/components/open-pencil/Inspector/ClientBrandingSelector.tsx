/**
 * 🏢 ClientBrandingSelector — Sélecteur de tenant client et injection de marque instantanée
 */

"use client";

import React, { useState } from 'react';
import { ClientBrandDna } from '@/kernel/open-pencil/overrides/TenantPageCustomizer';
import { Store, Check, RefreshCw } from 'lucide-react';

const PRESET_CLIENTS: ClientBrandDna[] = [
    {
        tenantId: '_demo_restaurant',
        restaurantName: 'Le Petit Poucet (Référence)',
        primaryColor: '#C5A059',
        fontFamilyBrand: 'Cormorant Garamond, serif',
    },
    {
        tenantId: 'bistrot-parisien',
        restaurantName: 'Bistrot Parisien 1892',
        primaryColor: '#B91C1C', // Rouge bistro
        fontFamilyBrand: 'Cormorant Garamond, serif',
    },
    {
        tenantId: 'emerald-cocktail-bar',
        restaurantName: 'The Emerald Speakeasy',
        primaryColor: '#10B981', // Émeraude
        fontFamilyBrand: 'Inter, sans-serif',
    },
    {
        tenantId: 'tokyo-ramen-ya',
        restaurantName: 'Tokyo Ramen Lab',
        primaryColor: '#F59E0B', // Ambre doré
        fontFamilyBrand: 'Inter, sans-serif',
    },
];

interface ClientBrandingSelectorProps {
    currentTenantId: string;
    onApplyClientBrand: (brandDna: ClientBrandDna) => void;
    onResetToDefault: () => void;
}

export const ClientBrandingSelector: React.FC<ClientBrandingSelectorProps> = ({
    currentTenantId,
    onApplyClientBrand,
    onResetToDefault,
}) => {
    const [selectedTenantId, setSelectedTenantId] = useState(currentTenantId || '_demo_restaurant');
    const [customName, setCustomName] = useState('');
    const [customColor, setCustomColor] = useState('#C5A059');

    const handleSelectPreset = (client: ClientBrandDna) => {
        setSelectedTenantId(client.tenantId);
        onApplyClientBrand(client);
    };

    const handleApplyCustom = () => {
        if (!customName.trim()) return;
        const customDna: ClientBrandDna = {
            tenantId: `tenant-${customName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            restaurantName: customName,
            primaryColor: customColor,
            fontFamilyBrand: 'Cormorant Garamond, serif',
        };
        setSelectedTenantId(customDna.tenantId);
        onApplyClientBrand(customDna);
    };

    return (
        <div className="p-4 bg-bg-secondary border-b border-white/10 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-text-primary">Client Restaurateur Cible</span>
                </div>
                <button
                    onClick={onResetToDefault}
                    className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                    title="Réinitialiser la page au modèle usine"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
                {PRESET_CLIENTS.map(client => {
                    const isSelected = selectedTenantId === client.tenantId;
                    return (
                        <button
                            key={client.tenantId}
                            onClick={() => handleSelectPreset(client)}
                            className={`w-full p-2 rounded-xl flex items-center justify-between border transition-all text-left ${
                                isSelected
                                    ? 'bg-white/10 border-amber-500/50 text-white'
                                    : 'border-white/5 hover:bg-white/5 text-text-secondary'
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                    style={{ backgroundColor: client.primaryColor }}
                                />
                                <span className="text-xs font-medium truncate text-text-primary">
                                    {client.restaurantName}
                                </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </button>
                    );
                })}
            </div>

            {/* Custom Client Form */}
            <div className="pt-2 border-t border-white/5 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Nouveau Client</span>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        placeholder="Nom du restaurant..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-bg-tertiary/40 border border-white/10 text-xs text-text-primary placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
                    />
                    <input
                        type="color"
                        value={customColor}
                        onChange={e => setCustomColor(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border border-white/10 cursor-pointer p-0.5"
                    />
                    <button
                        onClick={handleApplyCustom}
                        disabled={!customName.trim()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs disabled:opacity-40 transition-colors"
                    >
                        Appliquer
                    </button>
                </div>
            </div>
        </div>
    );
};
