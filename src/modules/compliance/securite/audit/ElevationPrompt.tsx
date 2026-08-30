// @wip owner:compliance-team échéance:2026-Q4 — écran HACCP à intégrer dans le flow qualité (audit orphelins 2026-08-30)
'use client';

import { useState, useCallback } from 'react';
import { PERMISSION_ROLE_LEVELS, type PermissionRole } from '@/shared/nexus/contracts/permissions.types';
import { auditService } from './AuditService';

interface ElevationPromptProps {
    open: boolean;
    requiredRoleLevel: number;
    action: string;
    tenantId: string;
    actorId: string;
    actorRole: string;
    onSuccess: () => void;
    onCancel: () => void;
    verifyPin: (pin: string) => Promise<{ valid: boolean; elevatedRole?: PermissionRole }>;
}

export function ElevationPrompt({
    open,
    requiredRoleLevel,
    action,
    tenantId,
    actorId,
    actorRole,
    onSuccess,
    onCancel,
    verifyPin,
}: ElevationPromptProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string>();

    const requiredRoleName = Object.entries(PERMISSION_ROLE_LEVELS)
        .find(([, level]) => level >= requiredRoleLevel)?.[0] ?? `niveau ${requiredRoleLevel}`;

    const handleSubmit = useCallback(async () => {
        if (!pin) return;
        setError(undefined);
        const result = await verifyPin(pin);
        if (result.valid) {
            auditService.record({
                tenantId,
                actorId,
                actorRole,
                action: 'elevation',
                collection: 'policies',
                metadata: {
                    elevatedAction: action,
                    elevatedBy: result.elevatedRole ?? 'unknown',
                    requiredLevel: requiredRoleLevel,
                },
            }).catch(() => {});

            setPin('');
            onSuccess();
        } else {
            setError('PIN incorrect ou niveau insuffisant');
        }
    }, [pin, verifyPin, tenantId, actorId, actorRole, action, requiredRoleLevel, onSuccess]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-80 rounded-lg bg-white p-6 shadow-xl dark:bg-surface-bg">
                <h3 className="mb-2 text-lg font-semibold">Élévation requise</h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-text-secondary">
                    Cette action nécessite le PIN d&apos;un <strong>{requiredRoleName}+</strong>.
                </p>
                <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="mb-3 w-full rounded border px-3 py-2 text-center text-2xl tracking-widest dark:border-border-default dark:bg-surface-card"
                    placeholder="• • • •"
                    autoFocus
                />
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded border px-4 py-2 text-sm hover:bg-gray-100 dark:border-border-default dark:hover:bg-surface-card"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 rounded bg-status-info px-4 py-2 text-sm text-text-primary hover:bg-blue-700"
                    >
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );
}
