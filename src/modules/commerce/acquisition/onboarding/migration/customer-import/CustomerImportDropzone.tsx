import React from 'react';
import { Upload } from 'lucide-react';

interface CustomerImportDropzoneProps {
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CustomerImportDropzone({
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
}: CustomerImportDropzoneProps) {
  return (
    <label
      className={[
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all",
        isDragOver
          ? "border-action-primary bg-action-primary/5"
          : "border-border hover:border-action-primary/40 hover:bg-bg-secondary",
      ].join(" ")}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Upload className="w-8 h-8 text-text-muted" />
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">
          Glisser-déposer un fichier CSV
        </p>
        <p className="text-xs text-text-muted mt-1">
          ou cliquer pour parcourir · séparateur auto-détecté ( , ; tab )
        </p>
      </div>
      <input
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={onInputChange}
      />
    </label>
  );
}
