'use client';
import React, { useState } from 'react';
import type { ConnectorId } from '../migration/connectors/types';
import type { ImportCategory } from '../migration/types';
import { getGuide, getGuidesForConnector } from './exportGuides';
import { Button } from "@/shared/components/ui/Button";

import { useLanguage } from "@/shared/hooks";
interface ExportGuidePanelProps {
  connectorId: ConnectorId;
  category?: ImportCategory;
}

export function ExportGuidePanel({ connectorId, category }: ExportGuidePanelProps) {
    const { t } = useLanguage();
  const guides = category
    ? [getGuide(connectorId, category)].filter(Boolean)
    : getGuidesForConnector(connectorId);

  const [openIdx, setOpenIdx] = useState(0);

  if (!guides.length) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">📖</span>
        <h4 className="font-semibold text-blue-800 text-sm">{t('commerce.onboarding.howToExport')}</h4>
      </div>

      {guides.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {guides.map((g, i) => g && (
            <Button variant="ghost"
              key={i}
              onClick={() => setOpenIdx(i)}
              className={[
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                openIdx === i ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50',
              ].join(' ')}
            >
              {g.title.replace(/Exporter .* depuis /, '')}
            </Button>
          ))}
        </div>
      )}

      {guides[openIdx] && (() => {
        const guide = guides[openIdx]!;
        return (
          <div className="space-y-3">
            <p className="text-xs text-blue-700">{guide.intro}</p>
            <ol className="space-y-2">
              {guide.steps.map(s => (
                <li key={s.step} className="flex gap-3 text-xs text-blue-900">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-700 font-bold flex items-center justify-center">
                    {s.step}
                  </span>
                  <div>
                    <span>{s.instruction}</span>
                    {s.note && <span className="block text-blue-500 mt-0.5 italic">{s.note}</span>}
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex items-center gap-2 bg-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
              <span>📄</span>
              <span>Format attendu : <strong>{guide.resultFormat}</strong></span>
            </div>
            {guide.warningNote && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                <span className="shrink-0">⚠️</span>
                <span>{guide.warningNote}</span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
