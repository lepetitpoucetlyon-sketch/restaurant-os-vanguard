'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Mail, AlignLeft, PenLine, Send, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/shared/hooks';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { authedFetch } from '@/lib/client/authedFetch';

interface EmailTemplate {
  subject: string;
  body: string;
  signature: string;
}

const DEFAULT_TEMPLATE: EmailTemplate = {
  subject: 'Nous avons migre vers un nouveau systeme de reservation',
  body: 'Bonjour [prenom],\n\nNous avons recemment migre vers notre nouveau systeme de reservation. Vous pouvez desormais reserver en ligne directement sur [url-widget].\n\nVotre historique de reservations a ete conserve et vos preferences restent inchangees.\n\nNous vous remercions de votre fidelite.',
  signature: "L'equipe du restaurant",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

const inputClass =
  'w-full rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-text-primary text-sm font-medium placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition';

const textareaClass =
  'w-full rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-text-primary text-sm font-medium placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition resize-none';

function FieldLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-nano font-bold text-text-muted uppercase tracking-[0.2em] mb-1.5">
      <Icon className="w-3 h-3" />
      {label}
    </label>
  );
}

export default function MigrationEmailTemplate() {
  const { tenantId, activeTenantConfig } = useTenant();
  const slug = tenantId ?? (activeTenantConfig as { id?: string } | null)?.id ?? '';

  const [template, setTemplate] = useState<EmailTemplate>(DEFAULT_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const setField = <K extends keyof EmailTemplate>(key: K, value: string) =>
    setTemplate((t) => ({ ...t, [key]: value }));

  const handleSave = async () => {
    if (!slug) {
      toast.error('Identifiant tenant manquant');
      return;
    }
    setSaving(true);
    try {
      await Nexus.adapter.update(
        `tenants/${slug}/emailTemplates/migration`,
        { subject: template.subject, body: template.body, signature: template.signature, updatedAt: Date.now() },
        { vassalId: slug, actorId: 'system' }
      );
      toast.success('Template sauvegarde');
    } catch {
      toast.error('Echec de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!slug) {
      toast.error('Identifiant tenant manquant');
      return;
    }
    if (!template.subject.trim() || !template.body.trim()) {
      toast.error('L\'objet et le corps sont requis');
      return;
    }
    setSending(true);
    try {
      const res = await authedFetch('/api/crm/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: slug,
          segment: 'imported',
          template: { subject: template.subject, body: template.body, signature: template.signature },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Erreur serveur');
      toast.success('Campagne lancee avec succes');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-10"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-serif font-semibold text-text-primary">
          Email de bienvenue — clients importes
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Envoyez un email personnalise a tous vos clients migres depuis votre ancien logiciel.
        </p>
      </motion.div>

      {/* Info banner */}
      <motion.div
        variants={itemVariants}
        className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3"
      >
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          Utilisez <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">[prenom]</code> et{' '}
          <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">[url-widget]</code> comme variables dynamiques. Elles seront
          remplacees automatiquement a l'envoi.
        </p>
      </motion.div>

      {/* Template form */}
      <motion.div
        variants={itemVariants}
        className="bg-bg-secondary border border-border rounded-[2rem] p-6 space-y-5"
      >
        {/* Subject */}
        <div>
          <FieldLabel icon={Mail} label="Objet" />
          <input
            className={inputClass}
            placeholder="Ex: Nous avons migre vers un nouveau systeme de reservation"
            value={template.subject}
            onChange={(e) => setField('subject', e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Body */}
        <div>
          <FieldLabel icon={AlignLeft} label="Corps" />
          <textarea
            className={textareaClass}
            rows={8}
            placeholder="Bonjour [prenom], ..."
            value={template.body}
            onChange={(e) => setField('body', e.target.value)}
            maxLength={3000}
          />
          <p className="text-nano text-text-muted mt-1 text-right">
            {template.body.length} / 3000
          </p>
        </div>

        {/* Signature */}
        <div>
          <FieldLabel icon={PenLine} label="Signature" />
          <input
            className={inputClass}
            placeholder="Ex: L'equipe du restaurant"
            value={template.signature}
            onChange={(e) => setField('signature', e.target.value)}
            maxLength={200}
          />
        </div>
      </motion.div>

      {/* Preview */}
      <motion.div
        variants={itemVariants}
        className="bg-bg-secondary border border-border rounded-[2rem] p-6"
      >
        <p className="text-nano font-bold text-text-muted uppercase tracking-[0.2em] mb-3">
          Apercu
        </p>
        <div className="rounded-xl border border-border bg-bg-primary p-4 space-y-2 text-sm text-text-secondary">
          <p>
            <span className="text-text-muted text-xs">Objet : </span>
            <span className="font-medium">{template.subject || '—'}</span>
          </p>
          <hr className="border-border" />
          <pre className="whitespace-pre-wrap font-sans text-text-secondary leading-relaxed break-words">
            {template.body || '—'}
          </pre>
          {template.signature && (
            <>
              <hr className="border-border" />
              <p className="text-text-muted text-xs italic">{template.signature}</p>
            </>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          onClick={handleSave}
          disabled={saving || sending}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-border bg-bg-secondary text-text-primary font-semibold text-sm hover:bg-bg-tertiary transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder le template
        </button>

        <button
          onClick={handleSend}
          disabled={saving || sending || !template.subject.trim() || !template.body.trim()}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-accent text-text-primary font-semibold text-sm hover:bg-accent/90 transition disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {sending ? 'Envoi en cours...' : 'Envoyer aux clients importes'}
        </button>
      </motion.div>
    </motion.div>
  );
}
