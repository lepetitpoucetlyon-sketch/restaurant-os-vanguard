"use client";

import React from 'react';
import { useAtomValue } from 'jotai';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';
import { Construction, Lock, ExternalLink } from 'lucide-react';
import { whiteLabelInstanceConfig } from '@/config/instance';

/**
 * 🔒 SovereignLockout - The Suzerain's Shield
 * A high-priority overlay that intercepts all UI interaction when the
 * Master Control Center issues a lockout command (Maintenance, License, Audit).
 *
 * Écran terminal : aucune autre surface n'est atteignable derrière lui. Le recours
 * support doit donc réellement partir, pré-rempli du motif et de l'identifiant de
 * signal — c'est ce que le support demande en premier pour lever un verrou.
 */
export function SovereignLockout() {
  const config = useAtomValue(tenantConfigAtom);

  // Logic: Only activate if maintenance mode is ON, license is INVALID, or killSwitch is active
  const isLocked = config?.status?.maintenanceMode || config?.status?.licenceStatus === 'LOCKED' || config?.status?.killSwitch;

  const getLockReason = () => {
    if (config?.status?.killSwitch) return "SOUVERAINETÉ_RÉVOQUÉE";
    if (config?.status?.maintenanceMode) return "STABILISATION_SYSTÈME";
    if (config?.status?.licenceStatus === 'LOCKED') return "LICENCE_EXPIREE";
    return "ACCÈS_RESTREINT";
  };

  const getLockDescription = () => {
    if (config?.status?.killSwitch) return "L'accès à cette instance a été révoqué par l'Orchestrateur Central (MCC) pour des raisons de conformité ou de sécurité.";
    if (config?.status?.maintenanceMode) return "Le système est actuellement en cours de maintenance préventive. Toutes les opérations locales sont suspendues.";
    return "Votre licence d'utilisation a expiré. Veuillez contacter le support technique pour réactiver vos services.";
  };

  if (!isLocked) return null;

  const signalId = config?.status?.lastSignalId || 'LOCAL_OVERRIDE';
  const nodeId = process.env.NEXT_PUBLIC_TENANT_ID ?? 'inconnu';
  const reason = getLockReason();
  const tenantName = config?.name ?? nodeId;

  const supportHref =
    `mailto:${whiteLabelInstanceConfig.supportEmail}` +
    `?subject=${encodeURIComponent(`[${reason}] Accès verrouillé — ${tenantName}`)}` +
    `&body=${encodeURIComponent(
      `Bonjour,\n\nL'accès à notre instance est verrouillé.\n\n` +
      `Établissement : ${tenantName}\n` +
      `Motif : ${reason}\n` +
      `Signal ID : ${signalId}\n` +
      `Node : ${nodeId}\n\n` +
      `Merci de nous indiquer la marche à suivre pour rétablir le service.`,
    )}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sovereign-lockout-title"
    >
      <div className="w-full max-w-lg p-8 mx-4 border border-border rounded-3xl bg-surface-card shadow-2xl text-center space-y-8">

        {/* Animated Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative p-6 bg-primary/10 border border-primary/20 rounded-full">
            {config?.status?.maintenanceMode ? (
              <Construction className="w-12 h-12 text-primary animate-bounce" />
            ) : (
              <Lock className="w-12 h-12 text-primary" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-3">
          <h1 id="sovereign-lockout-title" className="text-3xl font-serif font-bold text-text-primary tracking-tight">
            ACCÈS RÉSERVÉ : {config?.status?.maintenanceMode ? 'MAINTENANCE' : 'SUSPENSION'}
          </h1>
          <p className="text-muted text-lg leading-relaxed">
            {getLockDescription()}
          </p>
        </div>

        {/* Support Link */}
        <div className="pt-6 border-t border-border">
          <a
            href={supportHref}
            className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-surface-glass hover:bg-surface-card text-text-primary font-medium transition-all group"
          >
            Contact Support Nexus
            <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Meta details */}
        <div className="text-nano font-mono text-secondary tracking-widest uppercase">
          Signal ID: {signalId} | NODE: {nodeId}
        </div>
      </div>
    </div>
  );
}
