'use client';

import React, { useState } from 'react';
import { useActionAccess } from '@/shared/hooks/useActionAccess';
import { useAuth } from '@/shared/providers/NexusCoreContext';
import type { PageKey } from '@/shared/nexus/contracts/permissions.types';
import { Loader2 } from 'lucide-react';
import { SecurityPinModal } from '@/shared/components/ui/SecurityPinModal';

export interface ActionGuardProps {
  page: PageKey | string;
  action: string;
  fallback?: React.ReactNode;
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
      <div onClickCapture={handleInterceptClick} className="contents">
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
