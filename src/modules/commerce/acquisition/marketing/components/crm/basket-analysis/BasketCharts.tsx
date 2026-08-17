"use client";

export function BarChartSVG({
  data,
  valueKey,
  labelKey,
  color = "#c5a059",
  formatValue,
}: {
  data: Record<string, number | string>[];
  valueKey: string;
  labelKey: string;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const values = data.map((d) => Number(d[valueKey]));
  const max = Math.max(...values, 0.01);
  const W = 500;
  const H = 120;
  const barW = Math.floor(W / data.length) - 6;
  const fmt = formatValue ?? ((v: number) => v.toFixed(0));

  return (
    <svg viewBox={`0 0 ${W} ${H + 32}`} width="100%" aria-hidden="true">
      {data.map((d, i) => {
        const v = Number(d[valueKey]);
        const barH = max > 0 ? (v / max) * H : 0;
        const x = i * (W / data.length) + 3;
        const y = H - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={color}
              opacity={barH === 0 ? 0.15 : 0.85}
            />
            {barH > 0 && (
              <text
                x={x + barW / 2}
                y={Math.max(y - 4, 8)}
                textAnchor="middle"
                fontSize={9}
                fill={color}
                fontFamily="monospace"
              >
                {fmt(v)}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H + 18}
              textAnchor="middle"
              fontSize={9}
              fill="rgba(255,255,255,0.4)"
              fontFamily="sans-serif"
            >
              {String(d[labelKey])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function HorizontalBarsSVG({
  items,
  max,
  color = "#c5a059",
}: {
  items: { label: string; value: number }[];
  max: number;
  color?: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
              style={{ background: `${color}22`, color }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-text-primary font-medium truncate pr-2">{item.label}</span>
                <span className="text-text-muted font-mono shrink-0">{item.value}×</span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
