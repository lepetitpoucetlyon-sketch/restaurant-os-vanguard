import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { ColumnMapping, TargetField } from '../types';

export function ColumnMapperUI({
  mappings,
  targetFields,
  onChange,
  onConfirm,
}: {
  mappings: ColumnMapping[];
  targetFields: TargetField[];
  onChange: (m: ColumnMapping[]) => void;
  onConfirm: () => void;
}) {
  const required = targetFields.filter(f => f.required);
  const mapped = mappings.filter(m => m.targetField !== null).map(m => m.targetField);
  const missingRequired = required.filter(f => !mapped.includes(f.key));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Faites correspondre les colonnes de votre fichier aux champs de Restaurant OS.
      </p>
      <div className="divide-y divide-border rounded-lg border overflow-hidden">
        {mappings.map((m, i) => (
          <div key={m.sourceColumn} className="flex items-center gap-3 px-4 py-2 bg-card text-sm">
            <span className="w-36 truncate font-mono text-xs text-muted-foreground shrink-0">{m.sourceColumn}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
            <select
              className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={m.targetField ?? ''}
              onChange={e => {
                const next = [...mappings];
                next[i] = { ...m, targetField: e.target.value || null };
                onChange(next);
              }}
            >
              <option value="">— Ignorer —</option>
              {targetFields.map(f => (
                <option key={f.key} value={f.key}>
                  {f.label}{f.required ? ' *' : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {missingRequired.length > 0 && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Champs obligatoires non mappés : {missingRequired.map(f => f.label).join(', ')}
        </p>
      )}
      <button
        onClick={onConfirm}
        disabled={missingRequired.length > 0}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        Valider le mapping → Aperçu
      </button>
    </div>
  );
}
