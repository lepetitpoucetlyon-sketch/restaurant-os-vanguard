'use client';
import { useEffect, useState } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';

type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'down';

interface HealthSnapshot {
  status: HealthStatus;
  updatedAt: string;
}

const STATUS_COLOR: Record<HealthStatus, string> = {
  healthy:  '#22c55e',
  degraded: '#f59e0b',
  critical: '#ef4444',
  down:     '#6b7280',
};

const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy:  'OK',
  degraded: 'Dégradé',
  critical: 'Critique',
  down:     'Hors-ligne',
};

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export function HealthHistorySparkline({ tenantId }: { tenantId: string }) {
  const [history, setHistory] = useState<Record<string, HealthSnapshot>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const days = last7Days();

    Promise.all(
      days.map(day =>
        Nexus.adapter
          .get<HealthSnapshot>(`mcc/tenantHealth/${tenantId}/history/${day}`)
          .catch(() => null),
      ),
    ).then(results => {
      if (cancelled) return;
      const map: Record<string, HealthSnapshot> = {};
      days.forEach((day, i) => {
        if (results[i]) map[day] = results[i]!;
      });
      setHistory(map);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [tenantId]);

  const days = last7Days();
  const BAR_W = 10;
  const BAR_GAP = 4;
  const BAR_MAX = 28;
  const W = days.length * (BAR_W + BAR_GAP) - BAR_GAP;
  const H = BAR_MAX + 12; // label row at bottom

  return (
    <div className="flex flex-col gap-1">
      <p className="text-nano font-black uppercase tracking-[0.3em] text-secondary">Santé 7 jours</p>
      {loading ? (
        <div className="h-10 w-full animate-pulse rounded bg-surface-card/60" />
      ) : (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          {days.map((day, i) => {
            const snap = history[day];
            const status = snap?.status ?? null;
            const color = status ? STATUS_COLOR[status] : '#374151';
            const label = day.slice(5); // MM-DD
            const x = i * (BAR_W + BAR_GAP);
            return (
              <g key={day}>
                <title>{`${day} : ${status ? STATUS_LABEL[status] : 'Aucune donnée'}`}</title>
                <rect
                  x={x}
                  y={0}
                  width={BAR_W}
                  height={BAR_MAX}
                  rx={3}
                  fill={color}
                  opacity={status ? 0.85 : 0.25}
                />
                <text
                  x={x + BAR_W / 2}
                  y={BAR_MAX + 10}
                  textAnchor="middle"
                  fontSize={7}
                  fill="currentColor"
                  opacity={0.5}
                >
                  {label.replace('-', '/')}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <div className="flex gap-3 mt-1">
        {(Object.entries(STATUS_COLOR) as [HealthStatus, string][]).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1 text-nano text-secondary">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: c }} />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  );
}
