import React from 'react';
import { Upload } from 'lucide-react';

interface FECDropzoneProps {
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FECDropzone({
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
}: FECDropzoneProps) {
  return (
    <label
      className={[
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all",
        isDragOver
          ? "border-action-primary bg-action-primary/5"
          : "border-border hover:border-action-primary/50 hover:bg-bg-secondary",
      ].join(" ")}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Upload className="w-8 h-8 text-text-muted" />
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">
          Glisser-déposer le fichier FEC
        </p>
        <p className="text-xs text-text-muted mt-1">
          Format pipe-séparé (|) — .txt ou .csv
        </p>
      </div>
      <input
        type="file"
        accept=".txt,.csv,text/plain,text/csv"
        className="sr-only"
        onChange={onInputChange}
      />
    </label>
  );
}
