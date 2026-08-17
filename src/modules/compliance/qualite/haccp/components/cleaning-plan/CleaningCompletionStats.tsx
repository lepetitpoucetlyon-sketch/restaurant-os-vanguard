'use client';

interface CompletionStat {
    zone: string;
    done: number;
    total: number;
    pct: number;
}

interface CleaningCompletionStatsProps {
    completionByZone: CompletionStat[];
}

export function CleaningCompletionStats({ completionByZone }: CleaningCompletionStatsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-surface-sidebar rounded-xl border border-border">
            {completionByZone.map(z => (
                <div key={z.zone} className="flex flex-col items-center gap-1">
                    <div className="text-xs font-medium text-text-muted">{z.zone}</div>
                    <div
                        className={`text-2xl font-black ${z.pct === 100 ? 'text-status-success' : z.pct >= 50 ? 'text-status-warning' : 'text-status-danger'}`}
                    >
                        {z.pct}%
                    </div>
                    <div className="text-xs text-text-muted">{z.done}/{z.total} tâches</div>
                    <div className="w-full bg-border rounded-full h-1.5 mt-1">
                        <div
                            className={`h-1.5 rounded-full transition-all ${z.pct === 100 ? 'bg-status-success' : z.pct >= 50 ? 'bg-status-warning' : 'bg-status-danger'}`}
                            style={{ width: `${z.pct}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
