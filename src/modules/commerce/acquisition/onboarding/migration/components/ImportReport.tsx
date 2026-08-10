import { CheckCircle, RotateCcw } from 'lucide-react';

export function ImportReport({
  result,
  categoryLabel,
  onReset,
}: {
  result: { created: number; updated: number; skipped: number; errors: { row: number; message: string }[] };
  categoryLabel: string;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="font-semibold">Import {categoryLabel} terminé</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Créés', value: result.created, cls: 'text-green-600 dark:text-green-400' },
          { label: 'Mis à jour', value: result.updated, cls: 'text-blue-600 dark:text-blue-400' },
          { label: 'Ignorés', value: result.skipped, cls: 'text-muted-foreground' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-lg border bg-card p-3 text-center">
            <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      {/* Masked email warning — mig-18 */}
      {(() => {
        const maskedCount = result.errors.filter(e =>
          e.message.toLowerCase().includes('masqué') || e.message.toLowerCase().includes('masked')
        ).length;
        return maskedCount > 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-action-primary/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>
              <strong>{maskedCount} contact{maskedCount > 1 ? 's' : ''} TheFork ignoré{maskedCount > 1 ? 's' : ''} (emails masqués)</strong>
              {' — '}récupérez-les via l'export TheFork Pro
            </span>
          </div>
        ) : null;
      })()}
      {result.errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-destructive">{result.errors.length} erreur(s) :</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs text-muted-foreground">Ligne {e.row} : {e.message}</p>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Nouvel import
      </button>
    </div>
  );
}
