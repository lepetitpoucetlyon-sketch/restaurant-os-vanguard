'use client';

import { Link2, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProviderCatalogEntry } from '@/modules/human';
import { PayrollStatusBadge } from './PayrollStatusBadge';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface PayrollProviderTabProps {
    currentEntry: ProviderCatalogEntry;
    activeTab: string;
    activeProvider: string | null;
    periode: string;
    fieldValues: Record<string, string>;
    setFieldValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    syncStatus: AsyncStatus;
    connectStatus: AsyncStatus;
    connectInfo: string;
    onFieldConnect: () => void;
    onOAuthConnect: () => void;
    onSync: () => void;
}

export function PayrollProviderTab({
    currentEntry, activeTab, activeProvider, periode,
    fieldValues, setFieldValues,
    syncStatus, connectStatus, connectInfo,
    onFieldConnect, onOAuthConnect, onSync,
}: PayrollProviderTabProps) {
    return (
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
                            onClick={onFieldConnect}
                            disabled={connectStatus === 'loading'}
                            className="flex items-center gap-2 px-3 py-1.5 bg-surface-card dark:bg-surface-elevated hover:bg-surface-elevated dark:hover:bg-gray-600 disabled:opacity-50 text-text-primary text-sm rounded-lg transition-colors border border-gray-200 dark:border-border-default"
                        >
                            {connectStatus === 'loading'
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Link2 className="w-3.5 h-3.5" />}
                            Tester et connecter
                        </button>
                        {connectStatus === 'success' && (
                            <PayrollStatusBadge status="success" label={`${currentEntry.label} connecté${connectInfo ? ` — ${connectInfo}` : ''}`} />
                        )}
                        {connectStatus === 'error' && (
                            <PayrollStatusBadge status="error" label="Connexion échouée — vérifiez vos identifiants" />
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
                            onClick={onOAuthConnect}
                            disabled={syncStatus === 'loading'}
                            className="flex items-center gap-2 px-3 py-1.5 bg-surface-card dark:bg-surface-elevated hover:bg-surface-elevated dark:hover:bg-gray-600 disabled:opacity-50 text-text-primary text-sm rounded-lg transition-colors border border-gray-200 dark:border-border-default"
                        >
                            {syncStatus === 'loading'
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Link2 className="w-3.5 h-3.5" />}
                            Connecter via {currentEntry.label}
                        </button>
                        {syncStatus === 'success' && (
                            <PayrollStatusBadge status="success" label={`${currentEntry.label} connecté`} />
                        )}
                    </>
                )}
            </div>

            {/* Bouton sync */}
            {activeProvider === activeTab && (
                <button
                    onClick={onSync}
                    disabled={syncStatus === 'loading'}
                    className="flex items-center gap-2 px-4 py-2 bg-status-info hover:bg-blue-700 disabled:opacity-50 text-text-primary text-sm font-medium rounded-lg transition-colors"
                >
                    {syncStatus === 'loading'
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />}
                    Synchroniser {periode} → {currentEntry.label}
                </button>
            )}
            {activeProvider !== activeTab && (
                <p className="text-xs text-text-muted dark:text-text-secondary">
                    Connectez d&apos;abord {currentEntry.label} pour pouvoir synchroniser.
                </p>
            )}
            <PayrollStatusBadge status={syncStatus} />
        </div>
    );
}
