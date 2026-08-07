'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import { VERTICAL_DEFAULT_TOKENS, VERTICAL_APPEARANCE, VERTICAL_EXTRA_TOKENS } from '@/shared/nexus/tokens/verticals';
import { StatCard, StatsGrid } from '@/shared/components/ui/StatCard';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import GlassCard from '@/shared/components/ui/GlassCard';
import type { PlatformVariant } from '@/domain/schemas/tenant';
import { cn } from '@/lib/ui.foundations';
import { TrendingUp, Users, ShoppingCart, DollarSign, Star, Clock, Package, Heart } from 'lucide-react';

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

// ── Token table ───────────────────────────────────────────────────────────────

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

// ── Component showcase ────────────────────────────────────────────────────────

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
        <StatsGrid columns={4}>
          <StatCard label="Chiffre d'affaires" value="12 480 €" icon={<DollarSign />} intent="brand"   trend={{ value: 12, direction: 'up' }} />
          <StatCard label="Clients"             value="248"      icon={<Users />}      intent="success" />
          <StatCard label="En attente"           value="7"        icon={<Clock />}      intent="warning" />
          <StatCard label="Annulé"               value="3"        icon={<ShoppingCart />} intent="danger" />
        </StatsGrid>
        <div className="mt-4">
          <StatsGrid columns={4}>
            <StatCard label="Compact"   value="42"     icon={<Star />}    intent="info"    variant="compact" />
            <StatCard label="Défaut"    value="156"    icon={<Package />} intent="neutral" variant="default" />
            <StatCard label="Large"     value="89 %"   icon={<Heart />}   intent="brand"   variant="large" />
            <StatCard label="Minimal"   value="↑ 24"   intent="success"   variant="minimal" />
          </StatsGrid>
        </div>
      </section>

      {/* StatusBadges */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-4">
          StatusBadge — tous les statuts et variants
        </h3>
        <div className="flex flex-wrap gap-3">
          {(['success', 'warning', 'error', 'info', 'neutral', 'accent'] as const).map(status =>
            (['soft', 'outline', 'solid'] as const).map(v => (
              <StatusBadge key={`${status}-${v}`} status={status} variant={v} label={`${status} ${v}`} />
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          <StatusBadge status="success" label="Ouvert" pulse />
          <StatusBadge status="warning" label="Avertissement" pulse />
          <StatusBadge status="error"   label="Fermé" pulse />
        </div>
      </section>

      {/* Cards */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-4">
          Card — intents et GlassCard
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(['default', 'elevated', 'glass', 'ghost', 'premium'] as const).map(intent => (
            <Card key={intent} intent={intent} className="text-center">
              <CardContent className="pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-text-muted">{intent}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {(['default', 'elevated', 'inset'] as const).map(v => (
            <GlassCard key={v} variant={v} padding="md" rounded="xl" enableInitialAnimation={false}>
              <p className="text-xs font-black uppercase tracking-widest text-text-muted text-center">
                GlassCard {v}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  const currentVariant = useAtomValue(tenantVariantAtom);
  const [selected, setSelected] = useState<PlatformVariant>(currentVariant);

  const handleSelect = (v: PlatformVariant) => {
    setSelected(v);
  };

  return (
    <div className="min-h-screen bg-surface-bg p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary italic mb-1">Design System</h1>
        <p className="text-text-secondary text-sm">
          Catalogue des tokens et composants — switcher le vertical applique les tokens en temps réel.
        </p>
      </div>

      {/* Vertical switcher */}
      <div className="flex flex-wrap gap-2">
        {VERTICALS.map(v => (
          <button
            key={v.id}
            onClick={() => handleSelect(v.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
              selected === v.id
                ? "bg-action-primary text-action-primary-fg border-action-primary shadow-md"
                : "border-border-default text-text-secondary hover:bg-surface-card"
            )}
          >
            <span>{v.emoji}</span>
            {v.label}
          </button>
        ))}
      </div>

      {/* Current variant badge */}
      <div className="flex items-center gap-3">
        <StatusBadge
          status="accent"
          label={`Vertical actif : ${selected}`}
          variant="soft"
          size="lg"
        />
        <StatusBadge
          status={VERTICAL_APPEARANCE[selected] === 'dark' ? 'neutral' : 'info'}
          label={`Apparence par défaut : ${VERTICAL_APPEARANCE[selected]}`}
          variant="outline"
          size="sm"
        />
      </div>

      {/* Component showcase */}
      <ComponentShowcase key={selected} variant={selected} />
    </div>
  );
}
