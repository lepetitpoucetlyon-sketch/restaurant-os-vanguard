'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import { VERTICAL_DEFAULT_TOKENS, VERTICAL_APPEARANCE, VERTICAL_EXTRA_TOKENS } from '@/shared/nexus/tokens/verticals';
import {
  StatCard,
  StatGrid,
  StatusBadge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  GlassCard,
  PageShell,
  SectionCard,
  ActionBar,
  EmptyState,
  SkeletonList,
  RoleAwareView,
} from '@/shared/components/ui';
import type { PlatformVariant } from '@/modules/system';
import { cn } from '@/lib/ui.foundations';
import {
  Users,
  ShoppingCart,
  DollarSign,
  Star,
  Clock,
  Package,
  Heart,
  Layers,
  Shield,
  Smartphone,
  Sparkles,
  Layout,
  Plus,
  Filter,
  Download,
  AlertCircle,
} from 'lucide-react';

// ── Vertical switcher ────────────────────────────────────────────────────────

const VERTICALS: { id: PlatformVariant; label: string; emoji: string }[] = [
  { id: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { id: 'hotel',      label: 'Hôtel',      emoji: '🏨' },
  { id: 'bakery',     label: 'Boulangerie', emoji: '🥐' },
  { id: 'salon',      label: 'Salon',      emoji: '💇' },
  { id: 'clinic',     label: 'Clinique',   emoji: '🏥' },
  { id: 'garage',     label: 'Garage',     emoji: '🔧' },
  { id: 'retail',     label: 'Commerce',   emoji: '🛍️' },
  { id: 'custom',     label: 'Custom',     emoji: '✨' },
];

function TokenRow({ name, value }: { name: string; value: string }) {
  const isColor = /^#[0-9a-fA-F]{3,6}$|^rgba?\(/.test(value);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-default last:border-0">
      <code className="text-xs text-text-muted font-mono">{name}</code>
      <div className="flex items-center gap-2">
        {isColor && (
          <div
            className="w-5 h-5 rounded-md border border-border-default flex-shrink-0"
            style={{ backgroundColor: value }}
          />
        )}
        <code className="text-xs text-text-primary font-mono">{value}</code>
      </div>
    </div>
  );
}

function ComponentShowcase({ variant }: { variant: PlatformVariant }) {
  const tokens = VERTICAL_DEFAULT_TOKENS[variant];
  const appearance = VERTICAL_APPEARANCE[variant];
  const extraTokens = VERTICAL_EXTRA_TOKENS[variant];

  return (
    <div className="space-y-8">
      {/* Tokens */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-4">
          Tokens Design
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card intent="default">
            <CardHeader><CardTitle className="text-sm">Brand Tokens</CardTitle></CardHeader>
            <CardContent>
              {Object.entries(tokens).filter(([k]) => !k.includes('Url')).map(([k, v]) => (
                <TokenRow key={k} name={k} value={String(v)} />
              ))}
              <div className="pt-3 mt-3 border-t border-border-default">
                <TokenRow name="defaultAppearance" value={appearance} />
              </div>
            </CardContent>
          </Card>

          {Object.keys(extraTokens).length > 0 && (
            <Card intent="default">
              <CardHeader><CardTitle className="text-sm">Extra CSS Tokens</CardTitle></CardHeader>
              <CardContent>
                {Object.entries(extraTokens).map(([k, v]) => (
                  <TokenRow key={k} name={k} value={v} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* StatCards */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-4">
          StatCard — tous les intents
        </h3>
        <StatGrid columns={4}>
          <StatCard label="Chiffre d'affaires" value="12 480 €" icon={<DollarSign />} intent="brand" trend={{ value: 12, direction: 'up' }} />
          <StatCard label="Clients" value="248" icon={<Users />} intent="success" />
          <StatCard label="En attente" value="7" icon={<Clock />} intent="warning" />
          <StatCard label="Annulé" value="3" icon={<ShoppingCart />} intent="danger" />
        </StatGrid>
      </section>
    </div>
  );
}

function PatternsShowcase() {
  return (
    <div className="space-y-10">
      <SectionCard title="1. PageShell & Header Unifié" subtitle="Structure standardisée pour toutes les pages opérationnelles" variant="glass">
        <div className="p-4 rounded-xl bg-surface-bg border border-border-default space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-action-primary/10 border border-action-primary/20 text-action-primary flex items-center justify-center font-bold">
                🍽️
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-text-primary">POS Caisse Tactile</h4>
                <p className="text-xs text-text-secondary">Service du Midi • 24 Tables Actives</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline"><Filter className="w-3.5 h-3.5 mr-1" /> Filtres</Button>
              <Button size="sm" variant="default"><Plus className="w-3.5 h-3.5 mr-1" /> Nouvelle Commande</Button>
            </div>
          </div>
          <div className="text-xs text-text-muted font-mono">
            Remplacera les 19 headers ad-hoc divergeant dans le produit.
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. SectionCard & Variantes" subtitle="Conteneur modulaire (default, glass, premium, ghost)" variant="default">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SectionCard title="Variante Default" variant="default">
            <p className="text-xs text-text-secondary">Surface opaque standard avec bordure contrastée.</p>
          </SectionCard>
          <SectionCard title="Variante Glass" variant="glass">
            <p className="text-xs text-text-secondary">Flou backdrop-blur et lueur sombre subtile.</p>
          </SectionCard>
          <SectionCard title="Variante Premium" variant="premium">
            <p className="text-xs text-text-secondary">Bordure or et dégradé luxury.</p>
          </SectionCard>
          <SectionCard title="Variante Ghost" variant="ghost">
            <p className="text-xs text-text-secondary">Transparent sans ombre, adapté aux sous-sections.</p>
          </SectionCard>
        </div>
      </SectionCard>

      <SectionCard title="3. ActionBar Contextuelle" subtitle="Barre d'actions pour filtres, sélection et CTA primaires">
        <ActionBar
          leftSlot={<span className="text-xs font-medium text-text-secondary">3 éléments sélectionnés</span>}
          rightSlot={
            <>
              <Button size="sm" variant="outline">Exporter</Button>
              <Button size="sm" variant="destructive">Supprimer</Button>
            </>
          }
        />
      </SectionCard>

      <SectionCard title="4. EmptyState v2 & SkeletonList" subtitle="États de repli et squelettes de chargement fluides">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmptyState
            variant="compact"
            icon={Package}
            title="Aucune Commande en Attente"
            description="Toutes les commandes ont été traitées ou envoyées en cuisine."
            action={<Button size="sm" variant="default">Rafraîchir</Button>}
          />
          <SkeletonList count={3} variant="list" />
        </div>
      </SectionCard>
    </div>
  );
}

function RbacPreviewShowcase() {
  const [simulatedRole, setSimulatedRole] = useState<'admin' | 'manager' | 'serveur' | 'cuisinier'>('admin');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-card border border-border-default">
        <span className="text-xs font-bold text-text-secondary">Simuler le Rôle :</span>
        {(['admin', 'manager', 'serveur', 'cuisinier'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setSimulatedRole(r)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all",
              simulatedRole === r
                ? "bg-action-primary text-text-on-primary border-action-primary"
                : "border-border-default text-text-secondary hover:bg-surface-card"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <SectionCard title={`Simulation de Visibilité UI — Rôle : ${simulatedRole.toUpperCase()}`}>
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border-default bg-surface-bg flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-text-primary">Clôture Fiscale Z (Finance)</div>
              <div className="text-[11px] text-text-muted">Action critique autorisée pour : admin, directeur</div>
            </div>
            {simulatedRole === 'admin' ? (
              <StatusBadge status="success" label="Autorisé" />
            ) : (
              <StatusBadge status="error" label="Masqué par ActionGuard" />
            )}
          </div>

          <div className="p-4 rounded-xl border border-border-default bg-surface-bg flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-text-primary">Annuler une Ligne Ticket (POS)</div>
              <div className="text-[11px] text-text-muted">Action autorisée pour : admin, directeur, manager</div>
            </div>
            {simulatedRole === 'admin' || simulatedRole === 'manager' ? (
              <StatusBadge status="success" label="Autorisé" />
            ) : (
              <StatusBadge status="error" label="Masqué par ActionGuard" />
            )}
          </div>

          <div className="p-4 rounded-xl border border-border-default bg-surface-bg flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-text-primary">Prise de Commande & Encaissement (POS)</div>
              <div className="text-[11px] text-text-muted">Action autorisée pour : admin, manager, serveur</div>
            </div>
            {simulatedRole !== 'cuisinier' ? (
              <StatusBadge status="success" label="Autorisé" />
            ) : (
              <StatusBadge status="error" label="Masqué par ActionGuard" />
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function PwaPreviewShowcase() {
  return (
    <div className="space-y-6">
      <SectionCard title="PWA & Manifest Dynamique" subtitle="Aperçu des configurations de l'application installable">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-bg border border-border-default">
            <div className="text-xs font-bold text-text-primary mb-1">Affichage Standalone</div>
            <div className="text-[11px] text-text-secondary">Plein écran sans barre d'URL navigateur sur iOS & Android.</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-bg border border-border-default">
            <div className="text-xs font-bold text-text-primary mb-1">Precache Workbox</div>
            <div className="text-[11px] text-text-secondary">Routes critiques /pos et /kds disponibles immédiatement hors-ligne.</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-bg border border-border-default">
            <div className="text-xs font-bold text-text-primary mb-1">Apple Startup Images</div>
            <div className="text-[11px] text-text-secondary">12 résolutions iOS générées sans écran blanc au lancement.</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Page Principale ──────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  const currentVariant = useAtomValue(tenantVariantAtom);
  const [selectedVariant, setSelectedVariant] = useState<PlatformVariant>(currentVariant);
  const [activeMainTab, setActiveMainTab] = useState<'verticals' | 'patterns' | 'rbac' | 'pwa'>('patterns');

  return (
    <div className="min-h-screen bg-surface-bg p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-text-primary italic mb-1">
            Design System & Layout Primitives V2
          </h1>
          <p className="text-text-secondary text-xs">
            Fondations unifiées, guide de tokens, intégration RBAC granulaire et architectures multi-devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="accent" label="Grade X Certified" />
          <StatusBadge status="success" label="Tailwind v4 Theme" />
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border-default pb-3">
        {[
          { id: 'patterns', label: 'Patterns & Primitives', icon: Layout },
          { id: 'verticals', label: 'Verticales & Tokens', icon: Layers },
          { id: 'rbac', label: 'Matrice RBAC Preview', icon: Shield },
          { id: 'pwa', label: 'PWA & Devices', icon: Smartphone },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeMainTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveMainTab(t.id as typeof activeMainTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all",
                isActive
                  ? "bg-action-primary text-text-on-primary shadow-sm"
                  : "bg-surface-card hover:bg-surface-card/80 text-text-secondary border border-border-default"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeMainTab === 'patterns' && <PatternsShowcase />}

      {activeMainTab === 'verticals' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {VERTICALS.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all",
                  selectedVariant === v.id
                    ? "bg-action-primary text-action-primary-fg border-action-primary shadow-md"
                    : "border-border-default text-text-secondary hover:bg-surface-card"
                )}
              >
                <span>{v.emoji}</span>
                {v.label}
              </button>
            ))}
          </div>

          <ComponentShowcase key={selectedVariant} variant={selectedVariant} />
        </div>
      )}

      {activeMainTab === 'rbac' && <RbacPreviewShowcase />}

      {activeMainTab === 'pwa' && <PwaPreviewShowcase />}
    </div>
  );
}
