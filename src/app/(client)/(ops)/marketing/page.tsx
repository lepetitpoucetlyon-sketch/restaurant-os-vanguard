"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Megaphone, Instagram, FileSpreadsheet, Sparkles, PlusCircle, Users, Globe } from "lucide-react";

import { useMarketing, useQuotes } from "@modules/commerce/marketing/hooks";
import { NewCampaignModal } from "@modules/commerce/marketing/components/marketing";
import dynamic from "next/dynamic";
const NewQuoteDialog = dynamic(
  () => import("@modules/commerce/marketing/components/quotes").then(m => m.NewQuoteDialog),
  { ssr: false, loading: () => null }
);
import { ExpertHub } from "@modules/commerce/marketing/components/agency";
import { SEOManager } from "@modules/commerce/marketing/services/SEOManager";

type MktTab = "campaigns" | "social" | "quotes" | "ai" | "seo";

const VALID_TABS: MktTab[] = ["campaigns", "social", "quotes", "ai", "seo"];

type CampaignRow = { id: string; name?: string; type?: string };
type SocialRow = { id: string; platform?: string; handle?: string; followers?: number };
type QuoteRow = { id: string; title?: string; clientName?: string; status?: string };

export default function MarketingPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab") as MktTab | null;
    const [activeTab, setActiveTab] = useState<MktTab>(
        tabParam && VALID_TABS.includes(tabParam) ? tabParam : "campaigns"
    );
    const [campaignModalOpen, setCampaignModalOpen] = useState(false);
    const [quoteModalOpen, setQuoteModalOpen] = useState(false);

    const { campaigns, socialAccounts } = useMarketing();
    const { quotes } = useQuotes();

    const campaignRows = campaigns as CampaignRow[];
    const socialRows = socialAccounts as SocialRow[];
    const quoteRows = quotes as QuoteRow[];

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <header className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold">Marketing &amp; Social</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Campagnes, réseaux sociaux, devis et assistant IA de croissance.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCampaignModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md bg-action-primary text-white text-sm font-medium hover:opacity-90"
                    >
                        <PlusCircle className="w-4 h-4" /> Campagne
                    </button>
                    <button
                        onClick={() => setQuoteModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-hover"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Devis
                    </button>
                </div>
            </header>

            <nav className="flex gap-1 border-b border-border mb-6">
                {([
                    { id: "campaigns", label: "Campagnes", icon: Megaphone },
                    { id: "social", label: "Réseaux sociaux", icon: Instagram },
                    { id: "quotes", label: "Devis", icon: FileSpreadsheet },
                    { id: "ai", label: "Assistant IA", icon: Sparkles },
                    { id: "seo", label: "SEO", icon: Globe },
                ] as const).map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                active
                                    ? "border-action-primary text-action-primary"
                                    : "border-transparent text-text-muted hover:text-text-primary"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>

            <main>
                {activeTab === "campaigns" && (
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {campaignRows.map((c) => (
                            <div key={c.id} className="rounded-lg border border-border p-4 bg-surface-sidebar">
                                <div className="flex items-center gap-2 font-medium">
                                    <Megaphone className="w-4 h-4 text-action-primary" />
                                    {c.name ?? "Campagne"}
                                </div>
                                {c.type && <p className="text-xs text-text-muted mt-1">{c.type}</p>}
                            </div>
                        ))}
                        {campaignRows.length === 0 && (
                            <p className="text-sm text-text-muted italic py-8 col-span-full text-center">
                                Aucune campagne active.
                            </p>
                        )}
                    </section>
                )}

                {activeTab === "social" && (
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {socialRows.map((s) => (
                            <div key={s.id} className="rounded-lg border border-border p-4 bg-surface-sidebar">
                                <div className="flex items-center gap-2 font-medium">
                                    <Instagram className="w-4 h-4 text-action-primary" />
                                    {s.platform ?? "Réseau"} · {s.handle ?? ""}
                                </div>
                                <p className="flex items-center gap-1 text-xs text-text-muted mt-1">
                                    <Users className="w-3 h-3" /> {(s.followers ?? 0).toLocaleString("fr-FR")} abonnés
                                </p>
                            </div>
                        ))}
                        {socialRows.length === 0 && (
                            <p className="text-sm text-text-muted italic py-8 col-span-full text-center">
                                Aucun compte social connecté.
                            </p>
                        )}
                    </section>
                )}

                {activeTab === "quotes" && (
                    <section className="space-y-2">
                        {quoteRows.map((q) => (
                            <div
                                key={q.id}
                                className="flex items-center justify-between rounded-lg border border-border p-4 bg-surface-sidebar"
                            >
                                <div>
                                    <p className="font-medium">{q.title ?? q.clientName ?? "Devis"}</p>
                                    {q.clientName && <p className="text-xs text-text-muted">{q.clientName}</p>}
                                </div>
                                {q.status && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-surface-hover text-text-muted">
                                        {q.status}
                                    </span>
                                )}
                            </div>
                        ))}
                        {quoteRows.length === 0 && (
                            <p className="text-sm text-text-muted italic py-8 text-center">
                                Aucun devis en cours.
                            </p>
                        )}
                    </section>
                )}

                {activeTab === "ai" && (
                    <section>
                        <ExpertHub domain="general" />
                    </section>
                )}

                {activeTab === "seo" && (() => {
                    const seoConfig = SEOManager.generateConfig();
                    return (
                        <section className="space-y-4 max-w-2xl">
                            <div className="rounded-lg border border-border p-4 bg-surface-sidebar space-y-2">
                                <p className="text-xs text-text-muted uppercase tracking-wide font-medium flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5" /> Balises méta
                                </p>
                                <p className="text-sm font-medium">{seoConfig.title}</p>
                                <p className="text-xs text-text-muted">{seoConfig.description}</p>
                            </div>
                            <div className="rounded-lg border border-border p-4 bg-surface-sidebar space-y-2">
                                <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Open Graph</p>
                                <p className="text-sm">{seoConfig.openGraph.title}</p>
                                <p className="text-xs text-text-muted">{seoConfig.openGraph.url}</p>
                            </div>
                            <div className="rounded-lg border border-border p-4 bg-surface-sidebar space-y-2">
                                <p className="text-xs text-text-muted uppercase tracking-wide font-medium">JSON-LD (Schema.org)</p>
                                <pre className="text-xs text-text-muted overflow-x-auto bg-surface-hover rounded p-3">
                                    {JSON.stringify(seoConfig.jsonLd, null, 2)}
                                </pre>
                            </div>
                        </section>
                    );
                })()}
            </main>

            <NewCampaignModal isOpen={campaignModalOpen} onClose={() => setCampaignModalOpen(false)} />
            <NewQuoteDialog isOpen={quoteModalOpen} onClose={() => setQuoteModalOpen(false)} />
        </div>
    );
}
