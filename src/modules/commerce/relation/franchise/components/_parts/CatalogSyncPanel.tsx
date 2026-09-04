"use client";

import { RefreshCw } from 'lucide-react';

import { useLanguage } from "@/shared/hooks";
export function CatalogSyncPanel({ satelliteCount }: { satelliteCount: number }) {
    const { t } = useLanguage();
    return (
        <div className="p-8 rounded-2xl border border-border-subtle bg-surface-card space-y-6">
            <div>
                <h2 className="text-base font-bold text-text-primary">Diffusion Centrale de la Carte</h2>
                <p className="text-xs text-text-secondary">
                    Propagez vos fiches techniques, tarifs et nouveautés vers l’ensemble des restaurants de votre groupe.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-subtle space-y-2">
                    <span className="text-xs font-bold text-text-primary">{t('commerce.franchise.masterRestaurant')}</span>
                    <p className="text-micro text-text-secondary">Le Petit Poucet Lyon (Menu Printemps 2026)</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-subtle space-y-2">
                    <span className="text-xs font-bold text-text-primary">{t('commerce.franchise.networkTargets')}</span>
                    <p className="text-micro text-text-secondary">{satelliteCount} établissements satellites</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-subtle space-y-2">
                    <span className="text-xs font-bold text-text-primary">3. Mode de Diffusion</span>
                    <p className="text-micro text-text-secondary">{t('commerce.franchise.incrementalUpdate')}</p>
                </div>
            </div>

            <button
                onClick={() => alert('Catalogue répliqué avec succès sur l’ensemble du réseau.')}
                className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-bg-primary text-xs font-bold transition-all flex items-center gap-2"
            >
                <RefreshCw className="w-4 h-4" />
                Synchroniser la Carte sur le Réseau
            </button>
        </div>
    );
}
