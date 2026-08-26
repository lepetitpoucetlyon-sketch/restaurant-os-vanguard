'use client';

import React from 'react';
import { ScrapeCharterPanel } from '../components/ScrapeCharterPanel';
import { toast } from 'sonner';

export function ScrapeCharterTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-surface-card border border-border-default backdrop-blur-xl">
        <h2 className="text-xl font-bold text-text-primary mb-1">Morphogenèse Instantanée & Charte Graphique</h2>
        <p className="text-xs text-text-muted">
          Extraction automatique des couleurs de marque, logo, typographie, carte et signaux métiers depuis l'URL d'un client.
        </p>
      </div>

      <ScrapeCharterPanel
        onCharterExtracted={({ websiteUrl, profile, brandingOverlay }) => {
          toast.success(`Charte extraite avec succès pour ${profile.identity.name}`);
        }}
      />
    </div>
  );
}
