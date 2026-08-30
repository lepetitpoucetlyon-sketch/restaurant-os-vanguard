"use client";

/**
 * 🎨 ScrapeCharterPanel — Extraire la charte graphique depuis l'URL du client (MCC).
 *
 * Composant human-in-the-loop pour le pipeline P4 bonus MCC. Flow :
 *  1. Opérateur MCC saisit l'URL du site du client à onboarder.
 *  2. Bouton "Extraire" → POST /api/admin/mcc/tenants/scrape-charter.
 *  3. Aperçu visuel : couleurs primaires/secondaires, logo (si scrapé), font.
 *  4. Métadonnées : secteur détecté, confidence, catalogue extrait, angles morts.
 *  5. Opérateur valide → `onCharterExtracted(profile, brandingOverlay)` remonte au
 *     parent qui les passe à `provisionNewClient({...request, brandingOverlay, websiteUrl})`.
 *
 * Ne provisionne PAS lui-même. Purement observation + validation. Le
 * provisioning effectif reste à la charge du composant parent (formulaire
 * complet de création tenant) — c'est ce qui garantit le human-in-the-loop.
 */

import React, { useState, useCallback } from 'react';
import { Palette, Loader2, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { authedFetch } from '@/lib/client/authedFetch';
import { Button } from "@/shared/components/ui/Button";

// ── Types (miroir léger de la réponse API — évite les imports lourds) ─────────

interface BrandingOverlay {
    primaryColor: string;
    secondaryColor?: string;
    logoUrl?: string;
    fontFamily?: string;
}

interface ScrapeResponse {
    ok: boolean;
    profile?: {
        identity: { name: string; siren?: string };
        sectorSignals: { detectedVariant: string; confidence: number; evidence: readonly string[] };
        catalog: readonly unknown[];
        branding: { primaryColor: string; source: 'scraped' | 'default'; logoUrl?: string; fontFamily?: string };
        raw: { pagesCrawled: readonly string[]; warnings: readonly string[] };
    };
    brandingOverlay?: BrandingOverlay | null;
    note?: string;
    error?: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ScrapeCharterPanelProps {
    /**
     * Callback appelé quand l'opérateur valide l'extraction. Le parent est
     * responsable de merger `brandingOverlay` dans `ProvisioningRequest.branding`
     * puis d'appeler `provisionNewClient` avec le `websiteUrl` (qui rescrapera
     * pour garantir la fraîcheur — le preview ici n'est PAS mis en cache).
     */
    onCharterExtracted?: (payload: {
        websiteUrl: string;
        profile: NonNullable<ScrapeResponse['profile']>;
        brandingOverlay: BrandingOverlay | null;
    }) => void;
    /** Nom pré-rempli du champ fallbackName envoyé au scrape. */
    initialFallbackName?: string;
    /** SIREN pré-rempli (si l'opérateur l'a déjà). */
    initialSiren?: string;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ScrapeCharterPanel({
    onCharterExtracted,
    initialFallbackName,
    initialSiren,
}: ScrapeCharterPanelProps) {
    const [websiteUrl, setWebsiteUrl] = useState<string>('');
    const [fallbackName, setFallbackName] = useState<string>(initialFallbackName ?? '');
    const [siren, setSiren] = useState<string>(initialSiren ?? '');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<ScrapeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScrape = useCallback(async () => {
        if (!websiteUrl.trim()) {
            setError('URL requise');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await authedFetch('/api/admin/mcc/tenants/scrape-charter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    websiteUrl: websiteUrl.trim(),
                    fallbackName: fallbackName.trim() || undefined,
                    siren: siren.trim() || undefined,
                }),
            });
            const data = (await res.json()) as ScrapeResponse;
            setResult(data);
            if (!data.ok) {
                setError(data.error ?? 'Scrape refusé');
            }
        } catch (err) {
            const msg = toError(err).message;
            logger.error('[ScrapeCharterPanel] Erreur scrape', msg);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [websiteUrl, fallbackName, siren]);

    const handleValidate = useCallback(() => {
        if (!result?.ok || !result.profile) return;
        onCharterExtracted?.({
            websiteUrl: websiteUrl.trim(),
            profile: result.profile,
            brandingOverlay: result.brandingOverlay ?? null,
        });
    }, [result, websiteUrl, onCharterExtracted]);

    const profile = result?.profile;
    const overlay = result?.brandingOverlay;

    return (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
            <header className="flex items-center gap-3">
                <Palette className="w-6 h-6 text-amber-400" />
                <div>
                    <h3 className="text-lg font-semibold text-white">Extraire la charte graphique</h3>
                    <p className="text-sm text-white/60">
                        Scrape le site public du client → couleurs, logo, police. Human-in-the-loop.
                    </p>
                </div>
            </header>

            {/* ── Formulaire ─────────────────────────────────────────────────── */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm text-white/70 mb-1" htmlFor="scp-url">
                        URL du site du client <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="scp-url"
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://bistro-chez-marie.fr"
                        disabled={isLoading}
                        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm text-white/70 mb-1" htmlFor="scp-name">
                            Nom (fallback si non trouvé)
                        </label>
                        <input
                            id="scp-name"
                            type="text"
                            value={fallbackName}
                            onChange={(e) => setFallbackName(e.target.value)}
                            placeholder="Bistro Chez Marie"
                            disabled={isLoading}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white/70 mb-1" htmlFor="scp-siren">
                            SIREN (facultatif)
                        </label>
                        <input
                            id="scp-siren"
                            type="text"
                            value={siren}
                            onChange={(e) => setSiren(e.target.value)}
                            placeholder="123456789"
                            pattern="\d{9}"
                            disabled={isLoading}
                            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                        />
                    </div>
                </div>
                <Button variant="ghost" aria-label="Chargement"
                    type="button"
                    onClick={handleScrape}
                    disabled={isLoading || !websiteUrl.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold py-2 transition-colors"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Extraction en cours…
                        </>
                    ) : (
                        <>
                            <Palette className="w-4 h-4" />
                            Extraire la charte
                        </>
                    )}
                </Button>
            </div>

            {/* ── Erreur ─────────────────────────────────────────────────────── */}
            {error && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-200">
                        <div className="font-semibold">Scrape refusé</div>
                        <div className="opacity-80">{error}</div>
                    </div>
                </div>
            )}

            {/* ── Résultat ───────────────────────────────────────────────────── */}
            {result?.ok && profile && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                    {/* Identité + secteur */}
                    <div>
                        <div className="text-xs uppercase tracking-wide text-white/50 mb-1">Identité détectée</div>
                        <div className="flex items-baseline gap-3">
                            <div className="text-lg font-semibold text-white">{profile.identity.name}</div>
                            {profile.identity.siren && (
                                <div className="text-sm text-white/60 font-mono">SIREN {profile.identity.siren}</div>
                            )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm">
                            <span className="text-white/70">Secteur :</span>
                            <span className="font-semibold text-amber-300">{profile.sectorSignals.detectedVariant}</span>
                            <span className="text-white/40">·</span>
                            <span className={
                                profile.sectorSignals.confidence >= 0.7 ? 'text-green-400'
                                : profile.sectorSignals.confidence >= 0.4 ? 'text-yellow-400'
                                : 'text-red-400'
                            }>
                                confidence {(profile.sectorSignals.confidence * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    {/* Charte graphique — aperçu */}
                    <div>
                        <div className="text-xs uppercase tracking-wide text-white/50 mb-2">Charte graphique</div>
                        {overlay ? (
                            <div className="rounded-md border border-white/10 bg-black/30 p-3 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-md border border-white/20"
                                        style={{ backgroundColor: overlay.primaryColor }}
                                        title={`Couleur primaire ${overlay.primaryColor}`}
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm text-white font-semibold">Couleur primaire</div>
                                        <div className="text-xs text-white/60 font-mono">{overlay.primaryColor}</div>
                                    </div>
                                </div>
                                {overlay.secondaryColor && (
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-md border border-white/20"
                                            style={{ backgroundColor: overlay.secondaryColor }}
                                            title={`Couleur secondaire ${overlay.secondaryColor}`}
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm text-white font-semibold">Couleur secondaire</div>
                                            <div className="text-xs text-white/60 font-mono">{overlay.secondaryColor}</div>
                                        </div>
                                    </div>
                                )}
                                {overlay.logoUrl && (
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={overlay.logoUrl}
                                            alt="Logo scrapé"
                                            className="w-12 h-12 object-contain rounded-md border border-white/20 bg-white/5"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white font-semibold">Logo</div>
                                            <a
                                                href={overlay.logoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-amber-300 hover:underline flex items-center gap-1 truncate"
                                            >
                                                {overlay.logoUrl}
                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {overlay.fontFamily && (
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-md border border-white/20 flex items-center justify-center text-white font-bold text-lg bg-white/5"
                                            style={{ fontFamily: overlay.fontFamily }}
                                            title={`Font ${overlay.fontFamily}`}
                                        >
                                            Aa
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-white font-semibold">Police</div>
                                            <div className="text-xs text-white/60">{overlay.fontFamily}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-100">
                                    <div className="font-semibold">Aucune charte exploitable</div>
                                    <div className="opacity-80">Le site n'expose pas de branding scrapable. Le provisioning retombera sur les valeurs saisies manuellement.</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Métadonnées scrape */}
                    <details className="text-sm">
                        <summary className="cursor-pointer text-white/70 hover:text-white">
                            Détails du scrape ({profile.catalog.length} items catalogue · {profile.raw.pagesCrawled.length} pages · {profile.raw.warnings.length} warnings)
                        </summary>
                        <div className="mt-2 pl-4 space-y-1 text-xs text-white/60 font-mono">
                            {profile.raw.pagesCrawled.map((url) => (
                                <div key={url} className="truncate">✓ {url}</div>
                            ))}
                            {profile.raw.warnings.map((w, i) => (
                                <div key={i} className="text-yellow-400/80 truncate">⚠ {w}</div>
                            ))}
                        </div>
                    </details>

                    {/* Validation */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                        <div className="text-xs text-white/50">
                            {result.note}
                        </div>
                        {onCharterExtracted && (
                            <Button variant="ghost"
                                type="button"
                                onClick={handleValidate}
                                className="flex items-center gap-2 rounded-md bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Valider et utiliser
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
