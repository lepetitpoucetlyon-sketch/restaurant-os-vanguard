'use client';
import { useState } from 'react';
import { Check, Copy, Terminal, BookOpen, Zap, Shield, Activity, Rocket } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  comment?: string;
}

function CodeBlock({ code, comment }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <div className="relative group bg-surface-bg border border-border-subtle rounded-xl overflow-hidden">
      {comment && (
        <div className="px-4 py-2 border-b border-border-subtle">
          <span className="text-[10px] text-secondary font-mono">{comment}</span>
        </div>
      )}
      <div className="flex items-start gap-3 p-4">
        <span className="text-brand mt-0.5 select-none font-mono text-sm">$</span>
        <pre className="font-mono text-sm text-text-primary whitespace-pre-wrap break-all flex-1">{code}</pre>
      </div>
      <button
        onClick={copy}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-surface-card border border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-hover"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5 text-secondary" />}
      </button>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-action-primary/10 flex items-center justify-center text-brand">
          {icon}
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-primary">{title}</h3>
      </div>
      <div className="space-y-3 pl-11">{children}</div>
    </div>
  );
}

const ENV_BLOCK = `# .env.local
MCC_DEV_MODE=true                  # bypass serveur (routes /api/admin)
NEXT_PUBLIC_MCC_DEV_MODE=true      # bypass client (polling, MFA, telemetry)`;

const SECTIONS = [
  {
    id: 'setup',
    icon: <Rocket className="w-4 h-4" />,
    title: 'Démarrage rapide',
    items: [
      { code: 'npm run dev', comment: 'Lancer l\'app en local (port 3000)' },
      { code: 'docker-compose up', comment: 'App + LightRAG sidecar (port 9621)' },
      { code: 'npx tsc --noEmit', comment: 'Vérification TypeScript sans emit' },
    ],
  },
  {
    id: 'devmode',
    icon: <Shield className="w-4 h-4" />,
    title: 'Mode développeur MCC',
    items: [
      { code: ENV_BLOCK, comment: 'Activer le bypass MCC_DEV_MODE' },
    ],
    note: 'Avec MCC_DEV_MODE=true, le header Authorization: Bearer mcc-dev-bypass est injecté automatiquement par authedFetch. Ne jamais définir en production.',
  },
  {
    id: 'fleet',
    icon: <Activity className="w-4 h-4" />,
    title: 'CLI Fleet — opérations courantes',
    items: [
      {
        code: 'curl -s http://localhost:3000/api/admin/fleet \\\n  -H "Authorization: Bearer mcc-dev-bypass" | jq .',
        comment: 'Lister toutes les instances de la flotte',
      },
      {
        code: 'curl -s http://localhost:3000/api/admin/fleet/health \\\n  -H "Authorization: Bearer mcc-dev-bypass" | jq .tenants[].status',
        comment: 'Status santé de chaque tenant',
      },
      {
        code: 'curl -s http://localhost:3000/api/admin/fleet/seed-demo \\\n  -X POST -H "Authorization: Bearer mcc-dev-bypass" \\\n  -H "Content-Type: application/json" -d \'{}\' | jq .',
        comment: 'Activer l\'instance démo (si flotte vide)',
      },
    ],
  },
  {
    id: 'provisioning',
    icon: <Zap className="w-4 h-4" />,
    title: 'Provisionnement B2B',
    items: [
      {
        code: `curl -s http://localhost:3000/api/billing/signup \\
  -X POST -H "Content-Type: application/json" \\
  -d '{
    "name": "Café Test",
    "email": "owner@test.com",
    "variant": "restaurant",
    "tier": "starter",
    "trialDays": 14
  }' | jq .`,
        comment: 'Créer un tenant via la route publique (webhook-free)',
      },
    ],
  },
  {
    id: 'tests',
    icon: <Terminal className="w-4 h-4" />,
    title: 'Tests & Preflight',
    items: [
      { code: 'npx vitest run', comment: 'Lancer tous les tests unitaires' },
      { code: 'npx vitest run src/__tests__/onboarding/', comment: 'Tests onboarding seulement' },
      { code: './scripts/preflight.sh', comment: 'Gate complet avant PR (TSC + tests + sentrux)' },
      { code: 'sentrux check .', comment: 'Audit architectural (cycles, god files, couches)' },
    ],
  },
];

export function TutorialTab() {
  const [activeSection, setActiveSection] = useState('setup');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-action-primary/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h2 className="text-base font-black uppercase tracking-[0.2em]">Guide CLI & Tutoriel</h2>
          <p className="text-xs text-secondary mt-0.5">Commandes essentielles pour opérer la flotte MCC en développement</p>
        </div>
      </div>

      {/* Nav sections */}
      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-chip-label border transition-all ${
              activeSection === s.id
                ? 'bg-action-primary/10 border-focus/40 text-brand'
                : 'bg-surface-card border-border-subtle text-secondary hover:text-text-primary'
            }`}
          >
            {s.icon}
            {s.title}
          </button>
        ))}
      </div>

      {/* Content */}
      {SECTIONS.filter(s => s.id === activeSection).map(s => (
        <div key={s.id} className="space-y-6">
          <Section icon={s.icon} title={s.title}>
            {s.items.map((item, i) => (
              <CodeBlock key={i} code={item.code} comment={item.comment} />
            ))}
            {'note' in s && s.note && (
              <p className="text-xs text-secondary bg-surface-card border border-border-subtle rounded-xl p-3 leading-relaxed">
                {s.note}
              </p>
            )}
          </Section>
        </div>
      ))}

      {/* Env vars quick reference */}
      <div className="mt-8 p-5 rounded-2xl border border-border-subtle bg-surface-card/50 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Variables d&apos;environnement MCC</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
          {[
            ['MCC_DEV_MODE', 'Bypass serveur (routes API)'],
            ['NEXT_PUBLIC_MCC_DEV_MODE', 'Bypass client (polling, MFA, telemetry)'],
            ['NEXT_PUBLIC_FIREBASE_*', 'Config Firebase (voir .env.example)'],
            ['LIGHTRAG_API_URL', 'URL sidecar LightRAG (défaut: localhost:9621)'],
            ['STRIPE_SECRET_KEY', 'Clé Stripe pour webhooks billing'],
            ['STRIPE_WEBHOOK_SECRET', 'Secret de signature webhook Stripe'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-brand shrink-0">{k}</span>
              <span className="text-secondary">— {v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
