'use client';

import React from 'react';
import { PageShell } from '@/shared/components/ui/PageShell';
import { BrandingPanel } from '@/shared/components/settings/BrandingPanel';
import { withPageGuard } from '@/shared/components/rbac/PageGuard';
import { Sparkles, Palette } from 'lucide-react';

function BrandingSettingsPage() {
  return (
    <PageShell
      title="Identité Visuelle & Charte Graphique"
      subtitle="Personnalisez les couleurs, la typographie, les formes et l'écran de démarrage de votre restaurant"
      icon={Palette}
      breadcrumbs={[
        { label: 'Paramètres', href: '/settings' },
        { label: 'Branding & Charte' },
      ]}
    >
      <BrandingPanel />
    </PageShell>
  );
}

export default withPageGuard(BrandingSettingsPage, 'settings');
