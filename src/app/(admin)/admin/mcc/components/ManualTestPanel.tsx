'use client';
import { useState } from 'react';
import { Activity, ShieldAlert, CheckCircle, XCircle, Loader2, Play, Zap } from 'lucide-react';
import { authedFetch } from '@/lib/client/authedFetch';
import { useNexusFleet } from '@/shared/providers/fleet';
import type { EmpireInstance } from '@nexus/contracts';
import { toError } from "@/lib/toError";

type TestResult = { status: 'ok' | 'error'; message: string };
type ResultMap = Record<string, TestResult>;

const TESTS = [
  {
    id: 'health_ping',
    label: 'Health Ping',
    icon: <Activity className="w-4 h-4" />,
    color: 'text-status-success',
    description: 'Émet mcc.health_ping → vérifie que MccHealthPingHandler écrit en Nexus',
    buildPayload: (tenantId: string) => ({
      eventName: 'mcc.health_ping',
      payload: { tenantId, status: 'healthy', isManualTest: true },
    }),
  },
  {
    id: 'fiscal_audit',
    label: 'Fiscal Audit',
    icon: <ShieldAlert className="w-4 h-4" />,
    color: 'text-status-warning',
    description: 'Émet mcc.fiscal_audit_required → vérifie que MccFiscalAuditHandler crée un doc audit',
    buildPayload: (tenantId: string) => ({
      eventName: 'mcc.fiscal_audit_required',
      payload: {
        tenantId,
        reason: '[TEST MANUEL] Vérification handler fiscal depuis MCC',
        urgency: 'low',
        isManualTest: true,
      },
    }),
  },
] as const;

async function runTest(
  testId: (typeof TESTS)[number]['id'],
  tenantId: string,
): Promise<TestResult> {
  const test = TESTS.find(t => t.id === testId)!;
  try {
    const res = await authedFetch('/api/admin/system/simulate-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test.buildPayload(tenantId)),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      return { status: 'error', message: err.error ?? `HTTP ${res.status}` };
    }
    return { status: 'ok', message: 'Événement émis — vérifier Nexus logs' };
  } catch (e) {
    return { status: 'error', message: toError(e).message };
  }
}

function ResultBadge({ result }: { result?: TestResult }) {
  if (!result) return null;
  return result.status === 'ok' ? (
    <span className="flex items-center gap-1 text-nano text-status-success font-bold">
      <CheckCircle className="w-3 h-3" /> {result.message}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-nano text-status-error font-bold">
      <XCircle className="w-3 h-3" /> {result.message}
    </span>
  );
}

function InstanceRow({
  instance,
  results,
  running,
  onRun,
}: {
  instance: EmpireInstance;
  results: Record<string, TestResult | undefined>;
  running: string | null;
  onRun: (testId: string) => void;
}) {
  return (
    <div className="p-4 rounded-xl border border-border-subtle bg-surface-card/50 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-text-primary">{instance.name}</p>
          <p className="text-nano text-secondary font-mono">{instance.key}</p>
        </div>
        <div className="flex gap-2">
          {TESTS.map(test => {
            const key = `${instance.id}:${test.id}`;
            const isRunning = running === key;
            return (
              <button
                key={test.id}
                onClick={() => onRun(test.id)}
                disabled={isRunning || running !== null}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-chip-label transition-all disabled:opacity-40 ${
                  test.id === 'health_ping'
                    ? 'bg-status-success/10 border-status-success/30 text-status-success hover:bg-status-success/20'
                    : 'bg-status-warning/10 border-status-warning/30 text-status-warning hover:bg-status-warning/20'
                }`}
              >
                {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : test.icon}
                {test.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {TESTS.map(test => (
          <ResultBadge key={test.id} result={results[test.id]} />
        ))}
      </div>
    </div>
  );
}

export function ManualTestPanel({ instances: instancesProp }: { instances?: EmpireInstance[] }) {
  const fleet = useNexusFleet();
  const instances = instancesProp ?? fleet.instances;
  const [results, setResults] = useState<Record<string, ResultMap>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [globalRunning, setGlobalRunning] = useState(false);

  const handleRun = async (instanceId: string, testId: string) => {
    const instance = instances.find(i => i.id === instanceId);
    if (!instance) return;
    const key = `${instanceId}:${testId}`;
    setRunning(key);
    const result = await runTest(testId as (typeof TESTS)[number]['id'], instance.key);
    setResults(prev => ({
      ...prev,
      [instanceId]: { ...(prev[instanceId] ?? {}), [testId]: result },
    }));
    setRunning(null);
  };

  const handleRunAll = async (testId: string) => {
    setGlobalRunning(true);
    for (const inst of instances) {
      const key = `${inst.id}:${testId}`;
      setRunning(key);
      const result = await runTest(testId as (typeof TESTS)[number]['id'], inst.key);
      setResults(prev => ({
        ...prev,
        [inst.id]: { ...(prev[inst.id] ?? {}), [testId]: result },
      }));
    }
    setRunning(null);
    setGlobalRunning(false);
  };

  const okCount = (testId: string) =>
    Object.values(results).filter(r => r[testId]?.status === 'ok').length;

  const errCount = (testId: string) =>
    Object.values(results).filter(r => r[testId]?.status === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-brand" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em]">Tests manuels handlers</h3>
          <p className="text-nano text-secondary">Déclenche health ping et fiscal audit sur les tenants de la flotte</p>
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TESTS.map(t => (
          <div key={t.id} className="flex items-start gap-2 p-3 rounded-xl bg-surface-card border border-border-subtle">
            <span className={t.color}>{t.icon}</span>
            <div>
              <p className="text-chip-label text-text-primary">{t.label}</p>
              <p className="text-nano text-secondary leading-relaxed mt-0.5">{t.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Run all buttons + score */}
      {instances.length > 1 && (
        <div className="flex flex-wrap gap-3 items-center">
          {TESTS.map(t => (
            <button
              key={t.id}
              onClick={() => handleRunAll(t.id)}
              disabled={globalRunning || running !== null}
              className="flex items-center gap-1.5 px-4 py-2 bg-action-primary/10 border border-focus/30 text-brand rounded-xl text-chip-label hover:bg-action-primary/20 transition-all disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5" />
              Tous — {t.label}
            </button>
          ))}
          {Object.keys(results).length > 0 && (
            <div className="flex gap-3 text-nano ml-2">
              {TESTS.map(t => (
                <span key={t.id} className="text-secondary">
                  {t.label}: <span className="text-status-success">{okCount(t.id)} ✓</span>
                  {errCount(t.id) > 0 && <span className="text-status-error ml-1">{errCount(t.id)} ✗</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Per-instance rows */}
      {instances.length === 0 ? (
        <p className="text-sm text-secondary text-center py-6">Aucune instance dans la flotte</p>
      ) : (
        <div className="space-y-3">
          {instances.map(inst => (
            <InstanceRow
              key={inst.id}
              instance={inst}
              results={results[inst.id] ?? {}}
              running={running}
              onRun={testId => handleRun(inst.id, testId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
