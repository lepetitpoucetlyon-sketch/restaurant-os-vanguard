'use client';

import { useState } from 'react';
import { Download, Link2, CheckCircle, AlertCircle, Loader2, ChevronDown, FileText, Zap, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@ui/Toast';
import { authedFetch } from '@/lib/client/authedFetch';

type Provider = 'csv' | 'silae' | 'merge';
type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface ConnectState {
    silaeApiKey: string;
    silaeDossierId: string;
    silaeBaseUrl: string;
}

export function PayrollIntegrationPanel() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<Provider>('csv');
    const [periode, setPeriode] = useState<string>(new Date().toISOString().slice(0, 7));
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [connectForm, setConnectForm] = useState<ConnectState>({
        silaeApiKey: '',
        silaeDossierId: '',
        silaeBaseUrl: '',
    });
    const [connectStatus, setConnectStatus] = useState<SyncStatus>('idle');

    // CSV export
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
            showToast(String(err), 'error');
        }
    };

    // Silae connect
    const handleSilaeConnect = async () => {
        if (!connectForm.silaeApiKey || !connectForm.silaeDossierId) {
            showToast('Clé API et numéro de dossier requis', 'error');
            return;
        }
        setConnectStatus('loading');
        try {
            const res = await authedFetch('/api/admin/hr/payroll/silae/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: connectForm.silaeApiKey,
                    dossierId: connectForm.silaeDossierId,
                    baseUrl: connectForm.silaeBaseUrl || undefined,
                }),
            });
            const data = await res.json() as { success?: boolean; dossierNom?: string; error?: string };
            if (!res.ok) throw new Error(data.error ?? 'Connexion Silae échouée');
            setConnectStatus('success');
            showToast(`Silae connecté — ${data.dossierNom ?? connectForm.silaeDossierId}`, 'success');
        } catch (err) {
            setConnectStatus('error');
            showToast(String(err), 'error');
        }
    };

    // Silae sync
    const handleSilaeSync = async () => {
        setSyncStatus('loading');
        try {
            const res = await authedFetch('/api/admin/hr/payroll/silae/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ periode }),
            });
            const data = await res.json() as { success?: boolean; error?: string; synced?: number };
            if (!res.ok) throw new Error(data.error ?? 'Sync Silae échoué');
            setSyncStatus('success');
            showToast(`Silae — ${data.synced ?? '?'} employés synchronisés pour ${periode}`, 'success');
        } catch (err) {
            setSyncStatus('error');
            showToast(String(err), 'error');
        }
    };

    // Merge link flow
    const handleMergeLink = async () => {
        setSyncStatus('loading');
        try {
            const res = await authedFetch('/api/admin/hr/payroll/merge/link-token', { method: 'POST' });
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
                    const exRes = await authedFetch('/api/admin/hr/payroll/merge/exchange', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ publicToken }),
                    });
                    const exData = await exRes.json() as { success?: boolean; error?: string };
                    if (exData.success) {
                        setSyncStatus('success');
                        showToast('Prestataire RH connecté via Merge.dev', 'success');
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
            showToast(String(err), 'error');
        }
    };

    // Merge sync
    const handleMergeSync = async () => {
        setSyncStatus('loading');
        try {
            const res = await authedFetch('/api/admin/hr/payroll/merge/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ periode }),
            });
            const data = await res.json() as { success?: boolean; error?: string; synced?: number };
            if (!res.ok) throw new Error(data.error ?? 'Sync Merge échoué');
            setSyncStatus('success');
            showToast(`Merge.dev — ${data.synced ?? '?'} employés synchronisés pour ${periode}`, 'success');
        } catch (err) {
            setSyncStatus('error');
            showToast(String(err), 'error');
        }
    };

    const tabs: { key: Provider; label: string; icon: React.ReactNode; badge?: string }[] = [
        { key: 'csv', label: 'Export CSV', icon: <FileText className="w-4 h-4" />, badge: 'Comptable' },
        { key: 'silae', label: 'Silae', icon: <Zap className="w-4 h-4" />, badge: 'API directe' },
        { key: 'merge', label: 'Merge.dev', icon: <Globe className="w-4 h-4" />, badge: 'Multi-prestataire' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-text-primary">
                    Intégration Paie
                </h3>
                <p className="text-sm text-text-muted dark:text-text-secondary mt-0.5">
                    Exportez ou synchronisez le pré-paie HCR avec votre prestataire de paie.
                </p>
            </div>

            {/* Période sélecteur */}
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
                <nav className="flex gap-1 -mb-px">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSyncStatus('idle'); }}
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
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab content */}
            <div className="min-h-[180px]">
                {activeTab === 'csv' && (
                    <div className="space-y-4">
                        <div className="text-sm text-gray-600 dark:text-text-secondary space-y-1">
                            <p>Export du pré-paie en CSV UTF-8 (séparateur <code>;</code>, compatible Excel FR).</p>
                            <p>Colonnes : Matricule, Nom, Prénom, Période, H.Normales, H.Sup +25%, H.Sup +50%, H.Dimanche, H.Nuit, H.Fériés, Repas, Absences, CP, Taux (€), Brut estimé (€).</p>
                        </div>
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

                {activeTab === 'silae' && (
                    <div className="space-y-5">
                        <div className="text-sm text-gray-600 dark:text-text-secondary">
                            Synchronisation directe avec Silae via l&apos;API REST (IDCC 1997 HCR inclus). ~3–15€/bulletin/mois selon volume.
                        </div>

                        <div className="border border-gray-200 dark:border-border-default rounded-xl p-4 space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-text-secondary">Connexion Silae</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-text-muted dark:text-text-secondary mb-1 block">Clé API</label>
                                    <input
                                        type="password"
                                        placeholder="sk-silae-..."
                                        value={connectForm.silaeApiKey}
                                        onChange={e => setConnectForm(f => ({ ...f, silaeApiKey: e.target.value }))}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-card text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted dark:text-text-secondary mb-1 block">N° Dossier</label>
                                    <input
                                        type="text"
                                        placeholder="12345"
                                        value={connectForm.silaeDossierId}
                                        onChange={e => setConnectForm(f => ({ ...f, silaeDossierId: e.target.value }))}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-card text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-text-muted dark:text-text-secondary mb-1 block">URL base (optionnel)</label>
                                    <input
                                        type="text"
                                        placeholder="https://api.silae.fr (défaut)"
                                        value={connectForm.silaeBaseUrl}
                                        onChange={e => setConnectForm(f => ({ ...f, silaeBaseUrl: e.target.value }))}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-border-default rounded-lg bg-white dark:bg-surface-card text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSilaeConnect}
                                disabled={connectStatus === 'loading'}
                                className="flex items-center gap-2 px-3 py-1.5 bg-surface-card dark:bg-surface-elevated hover:bg-surface-elevated dark:hover:bg-gray-600 disabled:opacity-50 text-text-primary text-sm rounded-lg transition-colors"
                            >
                                {connectStatus === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                                Tester et connecter
                            </button>
                            {connectStatus === 'success' && <StatusBadge status="success" label="Silae connecté" />}
                            {connectStatus === 'error' && <StatusBadge status="error" label="Connexion échouée" />}
                        </div>

                        <button
                            onClick={handleSilaeSync}
                            disabled={syncStatus === 'loading'}
                            className="flex items-center gap-2 px-4 py-2 bg-status-info hover:bg-blue-700 disabled:opacity-50 text-text-primary text-sm font-medium rounded-lg transition-colors"
                        >
                            {syncStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Synchroniser {periode} vers Silae
                        </button>
                        <StatusBadge status={syncStatus} />
                    </div>
                )}

                {activeTab === 'merge' && (
                    <div className="space-y-5">
                        <div className="text-sm text-gray-600 dark:text-text-secondary space-y-1">
                            <p>Connectez n&apos;importe quel prestataire RH (PayFit, BambooHR, ADP, Personio, Factorial, Lucca…) via Merge.dev.</p>
                            <p className="text-xs text-amber-600 dark:text-action-primary">Note : Silae n&apos;est pas disponible via Merge.dev — utilisez l&apos;onglet Silae pour une connexion directe.</p>
                        </div>

                        <div className="border border-gray-200 dark:border-border-default rounded-xl p-4 space-y-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-text-secondary">Connexion prestataire RH</h4>
                            <p className="text-xs text-text-muted dark:text-text-secondary">
                                Cliquez ci-dessous pour ouvrir le flow Merge Link et connecter votre prestataire RH.
                                Une fenêtre popup vous guidera à travers l&apos;authentification OAuth.
                            </p>
                            <button
                                onClick={handleMergeLink}
                                disabled={syncStatus === 'loading'}
                                className="flex items-center gap-2 px-3 py-1.5 bg-surface-card dark:bg-surface-elevated hover:bg-surface-elevated dark:hover:bg-gray-600 disabled:opacity-50 text-text-primary text-sm rounded-lg transition-colors"
                            >
                                {syncStatus === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                                Connecter mon prestataire RH
                            </button>
                        </div>

                        <button
                            onClick={handleMergeSync}
                            disabled={syncStatus === 'loading'}
                            className="flex items-center gap-2 px-4 py-2 bg-status-info hover:bg-blue-700 disabled:opacity-50 text-text-primary text-sm font-medium rounded-lg transition-colors"
                        >
                            {syncStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                            Synchroniser {periode} via Merge.dev
                        </button>
                        <StatusBadge status={syncStatus} />
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status, label }: { status: SyncStatus; label?: string }) {
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
