"use client";

import React, { useEffect, useState } from 'react';
import { Eye, X, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface ImpersonationSession {
  sessionId: string;
  operatorId: string;
  tenantId: string;
  userId: string;
  expiresAt: string;
  revoked: boolean;
}

export function ImpersonationBanner() {
  const params    = useSearchParams();
  const sessionId = params.get('impersonate');
  const [session, setSession] = useState<ImpersonationSession | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/admin/fleet/users/impersonate/validate?sessionId=${encodeURIComponent(sessionId)}`)
      .then(r => r.ok ? r.json() as Promise<{ session: ImpersonationSession }> : null)
      .then(data => { if (data?.session && !data.session.revoked) setSession(data.session); })
      .catch(() => {});
  }, [sessionId]);

  const handleRevoke = async () => {
    if (!sessionId) return;
    await fetch(`/api/admin/fleet/users/impersonate?sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    setSession(null);
    // Remove param from URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete('impersonate');
    window.history.replaceState({}, '', url.toString());
  };

  if (!session) return null;

  const expiresIn = Math.max(
    0,
    Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 60000),
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-action-primary text-black flex items-center justify-between px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Eye className="w-4 h-4" />
        <AlertTriangle className="w-4 h-4" />
        <span>MODE IMPERSONATION — Session auditée · Opérateur MCC · Expire dans {expiresIn} min</span>
      </div>
      <button
        onClick={handleRevoke}
        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-black/20 hover:bg-black/30 px-3 py-1 rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        Quitter
      </button>
    </div>
  );
}
