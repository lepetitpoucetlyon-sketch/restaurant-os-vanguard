"use client";
/** @wip mohammed — écran cible /marketing, échéance 2026-09-15 */

import { Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

import { useLanguage } from "@/shared/hooks";
interface CampaignCardProps {
    campaign: {
        id: string;
        name: string;
        type: string;
        audience?: string;
        audienceSize?: number;
        sent?: number;
        opened?: number;
        clicked?: number;
    };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-3xl bg-surface-card/50 border border-subtle hover:bg-surface-card/80 transition-all gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                    campaign.type === 'email' ? "bg-gradient-to-br from-action-primary to-action-primary text-text-primary" : "bg-gradient-to-br from-status-success to-status-success text-text-primary"
                )}>
                    {campaign.type === 'email' ? <Mail size={24} /> : <MessageCircle size={24} />}
                </div>
                <div>
                    <h4 className="font-bold text-lg text-text-primary">{campaign.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                        <p className="text-xs font-medium text-text-muted">{campaign.audience} • <span className="text-text-primary font-bold">{campaign.audienceSize} cibles</span></p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end bg-surface-card/40 px-6 py-3 rounded-2xl border border-default">
                <div className="text-center md:text-right">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">{t('commerce.marketing.sent')}</p>
                    <p className="font-serif font-bold text-xl">{campaign.sent}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center md:text-right">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Ouverts</p>
                    <p className="font-serif font-bold text-xl text-status-success">{campaign.opened}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center md:text-right">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Clics</p>
                    <p className="font-serif font-bold text-xl text-brand">{campaign.clicked}</p>
                </div>
            </div>
        </div>
    );
}
