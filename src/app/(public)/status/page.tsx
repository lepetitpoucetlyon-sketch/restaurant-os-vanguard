export const dynamic = 'force-dynamic';
export const revalidate = 60;

import type { Metadata } from 'next';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Statut des services — Restaurant OS',
  description: 'État en temps réel des services Restaurant OS',
};

type ServiceStatus = 'operational' | 'degraded' | 'outage';

interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latencyMs?: number;
}

async function pingStripe(): Promise<ServiceCheck> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { name: 'Stripe (Facturation)', status: 'degraded' };
  const start = Date.now();
  try {
    const res = await fetch('https://api.stripe.com/v1/charges?limit=1', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    return { name: 'Stripe (Facturation)', status: res.ok ? 'operational' : 'degraded', latencyMs: Date.now() - start };
  } catch {
    return { name: 'Stripe (Facturation)', status: 'outage', latencyMs: Date.now() - start };
  }
}

async function pingResend(): Promise<ServiceCheck> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { name: 'Email (Resend)', status: 'degraded' };
  const start = Date.now();
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    return { name: 'Email (Resend)', status: res.status < 500 ? 'operational' : 'degraded', latencyMs: Date.now() - start };
  } catch {
    return { name: 'Email (Resend)', status: 'outage', latencyMs: Date.now() - start };
  }
}

async function pingDatabase(): Promise<ServiceCheck> {
  // Config check — real ping done in API route to avoid double latency budget
  const configured = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  return { name: 'Base de données', status: configured ? 'operational' : 'degraded' };
}

const STATUS_CONFIG: Record<ServiceStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  operational: { label: 'Opérationnel', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  degraded:    { label: 'Dégradé',      icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200'  },
  outage:      { label: 'Panne',        icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200'    },
};

const OVERALL_LABEL: Record<ServiceStatus, string> = {
  operational: 'Tous les systèmes sont opérationnels',
  degraded: 'Certains services sont dégradés',
  outage: 'Incident en cours',
};

export default async function StatusPage() {
  const [stripe, resend, db] = await Promise.allSettled([pingStripe(), pingResend(), pingDatabase()]);

  const services: ServiceCheck[] = [
    stripe.status  === 'fulfilled' ? stripe.value  : { name: 'Stripe (Facturation)', status: 'outage' as ServiceStatus },
    resend.status  === 'fulfilled' ? resend.value   : { name: 'Email (Resend)',       status: 'outage' as ServiceStatus },
    db.status      === 'fulfilled' ? db.value       : { name: 'Base de données',      status: 'outage' as ServiceStatus },
  ];

  const overall: ServiceStatus = services.some(s => s.status === 'outage')
    ? 'outage'
    : services.some(s => s.status === 'degraded')
    ? 'degraded'
    : 'operational';

  const overallCfg = STATUS_CONFIG[overall];
  const OverallIcon = overallCfg.icon;
  const checkedAt = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1A2350] flex items-center justify-center">
            <Activity className="w-6 h-6 text-[#C5A059]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Restaurant OS — Statut</h1>
            <p className="text-sm text-gray-500">État des services en temps réel</p>
          </div>
        </div>

        {/* Overall banner */}
        <div className={`rounded-2xl border p-6 flex items-center gap-4 ${overallCfg.bg} ${overallCfg.border}`}>
          <OverallIcon className={`w-7 h-7 flex-shrink-0 ${overallCfg.color}`} />
          <div>
            <p className={`text-base font-bold ${overallCfg.color}`}>{OVERALL_LABEL[overall]}</p>
            <p className="text-xs text-gray-500 mt-0.5">Vérifié le {checkedAt}</p>
          </div>
        </div>

        {/* Services list */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Services</h2>
          {services.map(service => {
            const cfg = STATUS_CONFIG[service.status];
            const Icon = cfg.icon;
            return (
              <div key={service.name} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.color}`} />
                <span className="flex-1 text-sm font-semibold text-gray-900">{service.name}</span>
                <div className="flex items-center gap-3">
                  {service.latencyMs !== undefined && (
                    <span className="text-xs text-gray-400 font-mono tabular-nums">{service.latencyMs}ms</span>
                  )}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center text-gray-400 pt-4 border-t border-gray-200">
          Propulsé par <span className="font-semibold text-gray-600">Restaurant OS</span>
        </p>
      </div>
    </div>
  );
}
