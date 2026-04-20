"use client";

import React, { useEffect, useState } from 'react';
import type { ImmunityLogEntry } from '@/shared/genome.types';

/**
 * 🛡️ SOVEREIGN SHIELD — Grade IX (Bouclier UX)
 * 
 * Composant global qui écoute les événements 'sovereign-guard-alert'
 * émis par l'ImmunityAuditLogger et affiche un toast de sécurité.
 * 
 * L'utilisateur voit un message clair au lieu d'un échec silencieux.
 * "On ne se contente pas de rejeter, on EXPLIQUE."
 */

interface ShieldAlert {
  id: number;
  entry: ImmunityLogEntry;
  visible: boolean;
}

let alertCounter = 0;

export const SovereignShield: React.FC = () => {
  const [alerts, setAlerts] = useState<ShieldAlert[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as ImmunityLogEntry;
      const id = ++alertCounter;

      setAlerts(prev => [...prev, { id, entry: detail, visible: true }]);

      // Auto-dismiss après 5 secondes
      setTimeout(() => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, visible: false } : a));
        // Cleanup du DOM après la transition
        setTimeout(() => {
          setAlerts(prev => prev.filter(a => a.id !== id));
        }, 300);
      }, 5000);
    };

    window.addEventListener('sovereign-guard-alert', handler);
    return () => window.removeEventListener('sovereign-guard-alert', handler);
  }, []);

  if (alerts.length === 0) return null;

  const reasonLabels: Record<string, string> = {
    DNA_CORRUPTION: 'Action non-autorisée dans l\'ADN du module',
    LINK_BROKEN: 'Dépendance système critique défaillante',
    MODULE_RED: 'Module en état de rupture',
    UNREGISTERED_MODULE: 'Module non enregistré dans le système',
    UNKNOWN: 'Violation du protocole de sécurité'
  };

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '420px',
      pointerEvents: 'none'
    }}>
      {alerts.map(alert => (
        <div
          key={alert.id}
          style={{
            background: 'linear-gradient(135deg, #1a0000 0%, #2d0a0a 100%)',
            border: '1px solid #ff3344',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            color: '#fff',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 8px 32px rgba(255, 51, 68, 0.3)',
            backdropFilter: 'blur(12px)',
            opacity: alert.visible ? 1 : 0,
            transform: alert.visible ? 'translateX(0)' : 'translateX(100%)',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '1px',
              color: '#ff3344'
            }}>
              SOVEREIGN GUARD — 403-Genome
            </span>
          </div>

          {/* Message */}
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4, color: '#e0e0e0' }}>
            {reasonLabels[alert.entry.reason] || 'Violation de sécurité détectée'}
          </p>

          {/* Details */}
          <div style={{
            marginTop: '0.5rem',
            padding: '0.4rem 0.6rem',
            background: 'rgba(255, 51, 68, 0.1)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#ff6b7a'
          }}>
            <div>Module: <strong>{alert.entry.moduleId}</strong></div>
            <div>Action: <strong>{alert.entry.attemptedPower}</strong></div>
            {alert.entry.blockedDependency && (
              <div>Dépendance: <strong>{alert.entry.blockedDependency}</strong></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
