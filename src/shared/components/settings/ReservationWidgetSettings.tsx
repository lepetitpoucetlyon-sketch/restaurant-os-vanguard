'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Globe, Settings2, Eye, Save, Loader2, Clock, CalendarDays } from 'lucide-react';
import { useTenant } from '@/shared/hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toast } from 'sonner';
import EmbedSnippets from '@/modules/commerce/widgets/EmbedSnippets';
import ROICalculator from '@/modules/commerce/widgets/ROICalculator';
import OnlineBookingToggle from '@/modules/commerce/widgets/OnlineBookingToggle';

interface WidgetSettings {
  slotDuration: 15 | 30 | 60;
  minNoticeHours: number;
  maxAdvanceDays: number;
}

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  slotDuration: 30,
  minNoticeHours: 2,
  maxAdvanceDays: 60,
};

const cinematicContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const cinematicItem: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={cinematicItem}
      className={`bg-bg-secondary border border-border rounded-[2rem] p-6 md:p-8 overflow-hidden relative group shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="w-11 h-11 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent flex-shrink-0"
      >
        <Icon className="w-5 h-5" />
      </motion.div>
      <div>
        <h3 className="text-xl font-serif font-semibold text-text-primary">{title}</h3>
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
  );
}

export default function ReservationWidgetSettings() {
  const { tenantId, activeTenantConfig } = useTenant();
  const slug = tenantId ?? (activeTenantConfig as { id?: string } | null)?.id ?? '';

  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>(DEFAULT_WIDGET_SETTINGS);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    try {
      await Nexus.adapter.update(
        `tenants/${slug}/tenantSettings/widget`,
        { slotDuration: widgetSettings.slotDuration, minNoticeHours: widgetSettings.minNoticeHours, maxAdvanceDays: widgetSettings.maxAdvanceDays, updatedAt: Date.now() },
        { vassalId: slug, actorId: 'system' }
      );
      toast.success('Parametres widget sauvegardes');
    } catch {
      toast.error('Echec de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    'rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition';

  const inputClass =
    'w-full rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition';

  return (
    <motion.div
      variants={cinematicContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20"
    >
      {/* ROI Calculator — top CTA */}
      <SectionCard>
        <ROICalculator />
      </SectionCard>

      {/* Embed code */}
      <SectionCard>
        <SectionHeader
          icon={Globe}
          title="Code d'integration"
          subtitle="Integrez le widget sur votre site"
        />
        {slug ? (
          <EmbedSnippets slug={slug} />
        ) : (
          <p className="text-sm text-text-muted">Chargement du slug...</p>
        )}
      </SectionCard>

      {/* Widget parameters */}
      <SectionCard>
        <SectionHeader
          icon={Settings2}
          title="Parametres widget"
          subtitle="Configuration des creneaux publics"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
              <Clock className="w-3 h-3 inline mr-1" />
              Duree de creneau
            </label>
            <select
              value={widgetSettings.slotDuration}
              onChange={(e) =>
                setWidgetSettings((s) => ({
                  ...s,
                  slotDuration: Number(e.target.value) as 15 | 30 | 60,
                }))
              }
              className={selectClass}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 heure</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
              <Clock className="w-3 h-3 inline mr-1" />
              Preavis minimum (h)
            </label>
            <input
              type="number"
              min={0}
              max={72}
              value={widgetSettings.minNoticeHours}
              onChange={(e) =>
                setWidgetSettings((s) => ({ ...s, minNoticeHours: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
              <CalendarDays className="w-3 h-3 inline mr-1" />
              Horizon max (jours)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={widgetSettings.maxAdvanceDays}
              onChange={(e) =>
                setWidgetSettings((s) => ({ ...s, maxAdvanceDays: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-text-primary font-semibold text-sm hover:bg-accent/90 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
        </div>
      </SectionCard>

      {/* Per-table online toggle */}
      <SectionCard>
        <SectionHeader
          icon={Globe}
          title="Tables reservables en ligne"
          subtitle="Activez la reservation par table"
        />
        {slug ? (
          <OnlineBookingToggle tenantId={slug} />
        ) : (
          <p className="text-sm text-text-muted">Chargement...</p>
        )}
      </SectionCard>

      {/* Preview */}
      <SectionCard>
        <SectionHeader icon={Eye} title="Apercu" subtitle="Rendu du widget public" />
        {slug ? (
          <div className="rounded-2xl border border-border overflow-hidden">
            <iframe
              src={`/${slug}/reservations`}
              width="100%"
              height="600"
              title="Apercu widget reservation"
              className="block"
            />
          </div>
        ) : (
          <p className="text-sm text-text-muted">Slug non disponible pour l'apercu.</p>
        )}
      </SectionCard>
    </motion.div>
  );
}
