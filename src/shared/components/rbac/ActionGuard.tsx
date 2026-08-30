'use client';

import React, { useState } from 'react';
import { useActionAccess } from '@/shared/hooks/useActionAccess';
import { useAuth } from '@/shared/providers/NexusCoreContext';
import type { PageKey } from '@/shared/nexus/contracts/permissions.types';
import { Loader2, Lock } from 'lucide-react';
import { SecurityPinModal } from '@/shared/components/ui/SecurityPinModal';

/**
 * `disabledMode` controls what happens when the user lacks permission:
 * - `'hide'`    (default) — children are replaced by `fallback` (backward compat).
 * - `'disable'` — children are rendered but visually disabled with a tooltip
 *   explaining why. The plan recommends this for POS actions so staff
 *   understands why a button is unavailable instead of it disappearing.
 */
export interface ActionGuardProps {
  page: PageKey | string;
  action: string;
  fallback?: React.ReactNode;
  /** @default 'hide' */
  disabledMode?: 'hide' | 'disable';
  /** Tooltip shown when disabledMode='disable' and user lacks permission. */
  disabledReason?: string;
  requiresPin?: boolean;
  pinTitle?: string;
  pinDescription?: string;
  onAuthorized?: () => void;
  children: React.ReactNode;
}

export function ActionGuard({
  page,
  action,
  fallback = null,
  disabledMode = 'hide',
  disabledReason = 'Réservé au responsable',
  requiresPin = false,
  pinTitle = 'Autorisation Requise',
  pinDescription = 'Veuillez saisir votre code PIN pour valider cette action sensible.',
  onAuthorized,
  children,
}: ActionGuardProps) {
  const { isAuthLoading } = useAuth();
  const hasAccess = useActionAccess(page, action);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAuthorizedSession, setIsAuthorizedSession] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="inline-flex items-center justify-center p-1">
        <Loader2 className="w-4 h-4 animate-spin text-action-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    if (disabledMode === 'disable') {
      return (
        <div
          className="relative group/guard contents"
          aria-disabled="true"
          title={disabledReason}
        >
          {/* Visual disable wrapper — blocks clicks, reduces opacity */}
          <div className="pointer-events-none opacity-40 select-none contents">
            {children}
          </div>
          {/* Tooltip on hover */}
          <div className="pointer-events-auto absolute -top-8 left-1/2 -translate-x-1/2 z-50 hidden group-hover/guard:flex items-center gap-1 px-2 py-1 rounded-md bg-bg-primary border border-border text-xs text-text-muted whitespace-nowrap shadow-lg">
            <Lock className="w-3 h-3" />
            {disabledReason}
          </div>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  if (!requiresPin || isAuthorizedSession) {
    return <>{children}</>;
  }

  const handleInterceptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    setIsAuthorizedSession(true);
    onAuthorized?.();
  };

  return (
    <>
      <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }} onClickCapture={handleInterceptClick} className="contents">
        {children}
      </div>

      <SecurityPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title={pinTitle}
        description={pinDescription}
      />
    </>
  );
}
