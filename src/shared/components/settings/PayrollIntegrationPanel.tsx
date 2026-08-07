'use client';

import { useState, useEffect } from 'react';
import { Download, Link2, CheckCircle, AlertCircle, Loader2, ChevronDown, FileText, RefreshCw, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@ui/Toast';
import { authedFetch } from '@/lib/client/authedFetch';
import { PROVIDER_CATALOG } from '@/modules/human';
import type { ProviderCatalogEntry } from '@/modules/human';
import { toError } from "@/lib/toError";

type ActiveTab = 'csv' | string;
type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

const CSV_TAB = 'csv';

export function PayrollIntegrationPanel() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<ActiveTab>(CSV_TAB);
    const [periode, setPeriode] = useState<string>(new Date().toISOString().slice(0, 7));
    const [syncStatus, setSyncStatus] = useState<AsyncStatus>('idle');
    const [connectStatus, setConnectStatus] = useState<AsyncStatus>('idle');
    const [connectInfo, setConnectInfo] = useState<string>('');
    // Champs du formulaire, clé par champ de catalogue
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    // Provider actuellement configuré (chargé depuis Nexus)
    const [activeProvider, setActiveProvider] = useState<string | null>(null);

    useEffect(() => {
        authedFetch('/api/admin/hr/payroll/settings')
            .then(r => r.ok ? r.json() : null)
            .then((data: { provider?: string } | null) => {
                if (data?.provider) setActiveProvider(data.provider);
            })
            .catch(() => null);
    }, []);

    const providerEntries = Object.entries(PROVIDER_CATALOG);

    const tabs = [
        { key: CSV_TAB, label: 'Export CSV', icon: <FileText className="w-4 h-4" />, badge: 'Comptable' },
        ...providerEntries.map(([key, entry]) => ({
            key,
            label: entry.label,
            icon: <Plug className="w-4 h-4" />,
            badge: entry.badge,
        })),
    ];

    const currentEntry: ProviderCatalogEntry | null =
        activeTab !== CSV_TAB ? (PROVIDER_CATALOG[activeTab] ?? null) : null;

    const handleTabChange = (key: ActiveTab) => {
        setActiveTab(key);
        setSyncStatus('idle');
        setConnectStatus('idle');
        setConnectInfo('');
        setFieldValues({});
    };

    // ── CSV export ────────────────────────────────────────────────────────────
    const handleCsvExport = async () => {
        setSyncStatus('loading');
        try {
            const res = await authedFetch(`/api/admin/hr/export/csv?periode=${periode}`);
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prepaie-${periode}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            setSyncStatus('success');
            showToast(`Export CSV ${periode} téléchargé`, 'success');
        } catch (err) {
            setSyncStatus('error');
            showToast(toError(err).message, 'error');
        }
    };

    // ── Connexion field-based (Silae, PayFit, ADP…) ──────────────────────────
    const handleFieldConnect = async () => {
        if (!currentEntry?.fields) return;
        const requiredFields = currentEntry.fields.filter(f => !f.optional);
        const missing = requiredFields.filter(f => !fieldValues[f.key]?.trim());
        if (missing.length) {
            showToast(`Champs requis : ${missing.map(f => f.label).join(', ')}`, 'error');
            return;
        }
        setConnectStatus('loading');
        try {
            const res = await authedFetch('/api/admin/hr/payroll/provider/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: activeTab, fields: fieldValues }),
            });
            const data = await res.json() as { success?: boolean; message?: string; info?: string; error?: string };
            if (!res.ok) throw new Error(data.error ?? 'Connexion échouée');
            setConnectStatus('success');
            setConnectInfo(data.info ?? '');
            setActiveProvider(activeTab);
            showToast(data.message ?? `${currentEntry.label} connecté`, 'success');
        } catch (err) {
            setConnectStatus('error');
            showToast(toError(err).message, 'error');
        }
    };

    // ── Connexion OAuth (Merge.dev…) ──────────────────────────────────────────
    const handleOAuthConnect = async () => {
        if (!currentEntry?.oauthLinkRoute || !currentEntry?.oauthExchangeRoute) return;
        setSyncStatus('loading');
        try {
            const res = await authedFetch(currentEntry.oauthLinkRoute, { method: 'POST' });
            const data = await res.json() as { link_token?: string; error?: string };
            if (!res.ok) throw new Error(data.error ?? 'Link token échoué');

            const linkUrl = `https://link.merge.dev/?link_token=${data.link_token}`;
            const popup = window.open(linkUrl, 'merge-link', 'width=600,height=700');
            if (!popup) {
                showToast('Popup bloquée — autorisez les popups pour ce site', 'error');
                setSyncStatus('idle');
                return;
            }
            const onMessage = async (event: MessageEvent) => {
                if (event.origin !== 'https://link.merge.dev') return;
                const { publicToken } = event.data as { publicToken?: string };
                if (!publicToken) return;
                window.removeEventListener('message', onMessage);
                popup.close();
                try {
                    const exRes = await authedFetch(currentEntry.oauthExchangeRoute!, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ publicToken }),
                    });
                    const exData = await exRes.json() as { success?: boolean; error?: string };
                    if (exData.success) {
                        setSyncStatus('success');
                        setActiveProvider(activeTab);
                        showToast(`${currentEntry.label} connecté`, 'success');
                    } else {
                        setSyncStatus('error');
                        showToast(exData.error ?? 'Échange token échoué', 'error');
                    }
                } catch (exErr) {
                    setSyncStatus('error');
                    showToast(String(exErr), 'error');
                }
            };
            window.addEventListener('message', onMessage);
            setSyncStatus('idle');
        } catch (err) {
            setSyncStatus('error');
            showToast(toError(err).message, 'error');
        }
    };

    // ── Sync période (route générique) ────────────────────────────────────────
    const handleSync = async () => {
        setSyncStatus('loading');
        try {
            const res = await authedFetch('/api/admin/hr/payroll/provider/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ periode }),
            });
            const data = await res.json() as {
                success?: boolean; error?: string;
                employeesUpserted?: number; variablesAccepted?: number; provider?: string;
            };
            if (!res.ok) throw new Error(data.error ?? 'Synchronisation échouée');
            setSyncStatus('success');
            const label = PROVIDER_CATALOG[data.provider ?? '']?.label ?? data.provider;
            showToast(
                `${label} — ${data.employeesUpserted ?? '?'} employés · ${data.variablesAccepted ?? '?'} variables · ${periode}`,
                'success',
            );
        } catch (err) {
            setSyncStatus('error');
            showToast(toError(err).message, 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-text-primary">
                        Intégration Paie
                    </h3>
                    <p className="text-sm text-text-muted dark:text-text-secondary mt-0.5">
                        Exportez ou synchronisez le pré-paie HCR avec votre prestataire.
                    </p>
                </div>
                {activeProvider && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-3 h-3" />
                        {PROVIDER_CATALOG[activeProvider]?.label ?? activeProvider} actif
                    </span>
                )}
            </div>

            {/* Période */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-text-secondary whitespace-nowrap">
                    Période
                </label>
                <div className="relative">
                    <input
                        type="month"
                        value={periode}
                        onChange={e => setPeriode(e.target.value)}
                        className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-card text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-border-default">
                <nav className="flex gap-1 -mb-px overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                                activeTab === tab.key
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-text-muted dark:text-text-secondary hover:text-gray-700 dark:hover:text-gray-200',
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.badge && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-surface-elevated text-text-muted dark:text-text-secondary">
                                    {tab.badge}
                                </span>
                            )}
                            {tab.key === activeProvider && tab.key !== CSV_TAB && (
                                <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Contenu */}
            <div className="min-h-[200px]">
                {/* CSV */}
                {activeTab === CSV_TAB && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-text-secondary">
                            Export UTF-8 (séparateur <code>;</code>, compatible Excel FR) — Matricule, Heures normales,
                            H.Sup +25%/+50%, Dimanche, Nuit, Fériés, Repas, Absences, CP, Taux, Brut estimé.
                        </p>
                        <button
                            onClick={handleCsvExport}
                            disabled={syncStatus === 'loading'}
                            className="flex items-center gap-2 px-4 py-2 bg-status-info hover:bg-blue-700 disabled:opacity-50 text-text-primary text-sm font-medium rounded-lg transition-colors"
                        >
                            {syncStatus === 'loading'
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Download className="w-4 h-4" />}
                            Télécharger prepaie-{periode}.csv
                        </button>
                        <StatusBadge status={syncStatus} />
                    </div>
                )}

                {/* Provider dynamique */}
                {currentEntry && (
                    <div className="space-y-5">
                        <p className="text-sm text-gray-600 dark:text-text-secondary">
                            {currentEntry.description}
                        </p>

                        {/* Section connexion */}
                        <div className="border border-gray-200 dark:border-border-default rounded-xl p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-text-secondary">
                                Connexion {currentEntry.label}
                            </h4>

                            {/* Field-based */}
                            {currentEntry.authType === 'fields' && currentEntry.fields && (
                                <>
                                    <div className={cn(
                                        'grid gap-3',
                                        currentEntry.fields.length > 2 ? 'grid-cols-1' : 'grid-cols-2',
                                    )}>
                                        {currentEntry.fields.map(field => (
                                            <div key={field.key} className={currentEntry.fields?.length === 1 ? 'col-span-2' : ''}>
                                                <label className="text-xs text-text-muted dark:text-text-secondary mb-1 block">
                                                    {field.label}
                                                    {field.optional && <span className="ml-1 opacity-60">(optionnel)</span>}
                                                </label>
                                                <input
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={fieldValues[field.key] ?? ''}
                                                    onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-card text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleFieldConnect}
                                        disabled={connectStatus === 'loading'}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-card dark:bg-surface-elevated hover:bg-surface-elevated dark:hover:bg-gray-600 disabled:opacity-50 text-text-primary text-sm rounded-lg transition-colors border border-gray-200 dark:border-border-default"
                                    >
                                        {connectStatus === 'loading'
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : <Link2 className="w-3.5 h-3.5" />}
                                        Tester et connecter
                                    </button>
                                    {connectStatus === 'success' && (
                                        <StatusBadge status="success" label={`${currentEntry.label} connecté${connectInfo ? ` — ${connectInfo}` : ''}`} />
                                    )}
                                    {connectStatus === 'error' && (
                                        <StatusBadge status="error" label="Connexion échouée — vérifiez vos identifiants" />
                                    )}
                                </>
                            )}

                            {/* OAuth */}
                            {currentEntry.authType === 'oauth' && (
                                <>
                                    <p className="text-xs text-text-muted dark:text-text-secondary">
                                        Une popup guidera l&apos;authentification OAuth avec votre prestataire RH.
                                    </p>
                                    <button
                                        onClick={handleOAuthConnect}
                                        disabled={syncStatus === 'loading'}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-card dark:bg-surface-elevated hover:bg-surface-elevated dark:hover:bg-gray-600 disabled:opacity-50 text-text-primary text-sm rounded-lg transition-colors border border-gray-200 dark:border-border-default"
                                    >
                                        {syncStatus === 'loading'
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : <Link2 className="w-3.5 h-3.5" />}
                                        Connecter via {currentEntry.label}
                                    </button>
                                    {syncStatus === 'success' && (
                                        <StatusBadge status="success" label={`${currentEntry.label} connecté`} />
                                    )}
                                </>
                            )}
                        </div>

                        {/* Bouton sync (disponible si ce provider est actif) */}
                        {activeProvider === activeTab && (
                            <button
                                onClick={handleSync}
                                disabled={syncStatus === 'loading'}
                                className="flex items-center gap-2 px-4 py-2 bg-status-info hover:bg-blue-700 disabled:opacity-50 text-text-primary text-sm font-medium rounded-lg transition-colors"
                            >
                                {syncStatus === 'loading'
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <RefreshCw className="w-4 h-4" />}
                                Synchroniser {periode} → {currentEntry.label}
                            </button>
                        )}
                        {activeProvider !== activeTab && activeTab !== CSV_TAB && (
                            <p className="text-xs text-text-muted dark:text-text-secondary">
                                Connectez d&apos;abord {currentEntry.label} pour pouvoir synchroniser.
                            </p>
                        )}
                        <StatusBadge status={syncStatus} />
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status, label }: { status: AsyncStatus; label?: string }) {
    if (status === 'idle' || status === 'loading') return null;
    return (
        <div className={cn(
            'flex items-center gap-2 text-sm',
            status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-status-danger',
        )}>
            {status === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
            {label ?? (status === 'success' ? 'Opération réussie' : 'Erreur — voir la notification')}
        </div>
    );
}
