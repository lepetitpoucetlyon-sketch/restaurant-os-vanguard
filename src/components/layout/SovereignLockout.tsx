"use client";

import React from 'react';
import { useAtomValue } from 'jotai';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';
import { Construction, Lock, ExternalLink } from 'lucide-react';

/**
 * 🔒 SovereignLockout - The Suzerain's Shield
 * A high-priority overlay that intercepts all UI interaction when the 
 * Master Control Center issues a lockout command (Maintenance, License, Audit).
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface-sidebar/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-lg p-8 mx-4 border border-subtle rounded-3xl bg-neutral-950/50 shadow-2xl text-center space-y-8">
        
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
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
            ACCÈS RÉSERVÉ : {config?.status?.maintenanceMode ? 'MAINTENANCE' : 'SUSPENSION'}
          </h1>
          <p className="text-muted text-lg leading-relaxed">
            {config?.status?.maintenanceMode
              ? "Le Suzerain (MCC) effectue une mise à jour critique de votre infrastructure. Le système redeviendra opérationnel sous peu."
              : "L'accès à cette instance a été suspendu pour des raisons administratives. Veuillez contacter le support technique."}
          </p>
        </div>

        {/* Support Link */}
        <div className="pt-6 border-t border-white/5">
          <button className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-surface-card/5 hover:bg-surface-card/10 text-white font-medium transition-all group">
            Contact Support Nexus
            <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Meta details */}
        <div className="text-[10px] font-mono text-secondary tracking-widest uppercase">
          Signal ID: {config?.status?.lastSignalId || 'LOCAL_OVERRIDE'} | NODE: {process.env.NEXT_PUBLIC_TENANT_ID}
        </div>
      </div>
    </div>
  );
}
