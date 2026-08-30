'use client';
import React, { useState } from 'react';
import { Input } from "@/shared/components/ui/Input";

interface PreviewTableProps {
  rows: Record<string, string>[];
  onRowChange?: (index: number, row: Record<string, string>) => void;
  maxRows?: number;
  readOnly?: boolean;
}

export function PreviewTable({ rows, onRowChange, maxRows = 50, readOnly = false }: PreviewTableProps) {
  const [editCell, setEditCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!rows.length) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Aucune donnée à afficher
      </div>
    );
  }

  const columns = Object.keys(rows[0]);
  const displayRows = rows.slice(0, maxRows);
  const hidden = rows.length - maxRows;

  const startEdit = (rowIdx: number, col: string, val: string) => {
    if (readOnly) return;
    setEditCell({ row: rowIdx, col });
    setEditValue(val);
  };

  const commitEdit = (rowIdx: number, col: string) => {
    if (!onRowChange) return;
    const updated = { ...displayRows[rowIdx], [col]: editValue };
    onRowChange(rowIdx, updated);
    setEditCell(null);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left text-gray-500 font-medium w-8">#</th>
            {columns.map(col => (
              <th key={col} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {displayRows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-gray-50 group">
              <td className="px-3 py-1.5 text-gray-400">{rowIdx + 1}</td>
              {columns.map(col => {
                const isEditing = editCell?.row === rowIdx && editCell?.col === col;
                return (
                  <td
                    key={col}
                    className="px-3 py-1.5 max-w-[200px] truncate cursor-pointer"
                    title={row[col] ?? ''}
                    onDoubleClick={() => startEdit(rowIdx, col, row[col] ?? '')}
                  >
                    {isEditing ? (
                      <Input
                        autoFocus
                        className="w-full border border-indigo-400 rounded px-1 py-0.5 text-xs"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(rowIdx, col)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(rowIdx, col);
                          if (e.key === 'Escape') setEditCell(null);
                        }}
                      />
                    ) : (
                      <span className="block truncate">{row[col] ?? ''}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {hidden > 0 && (
        <div className="px-4 py-2 text-center text-xs text-gray-400 border-t border-gray-100">
          … et {hidden} ligne{hidden > 1 ? 's' : ''} supplémentaire{hidden > 1 ? 's' : ''} non affichée{hidden > 1 ? 's' : ''}
        </div>
      )}
      {!readOnly && (
        <div className="px-4 py-2 text-xs text-gray-400 border-t bg-gray-50">
          Double-clic sur une cellule pour la modifier
        </div>
      )}
    </div>
  );
}
