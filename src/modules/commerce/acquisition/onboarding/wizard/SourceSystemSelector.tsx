'use client';
import React from 'react';
import type { ConnectorId } from '../migration/connectors/types';
import { ConnectorRegistry } from '../migration/connectors';

interface SourceSystemSelectorProps {
  selected: ConnectorId | null;
  onSelect: (id: ConnectorId) => void;
}

const CONNECTOR_GROUPS = [
  {
    label: 'Logiciels de caisse',
    ids: ['zelty', 'laddition', 'lightspeed', 'tiller', 'cashpad', 'popina'] as ConnectorId[],
  },
  {
    label: 'Réservations & gestion de salle',
    ids: ['zenchef', 'thefork'] as ConnectorId[],
  },
  {
    label: 'Comptabilité',
    ids: ['pennylane', 'sage'] as ConnectorId[],
  },
];

export function SourceSystemSelector({ selected, onSelect }: SourceSystemSelectorProps) {
  return (
    <div className="space-y-6">
      {CONNECTOR_GROUPS.map(group => {
        const connectors = group.ids
          .map(id => {
            try { return ConnectorRegistry.get(id); } catch { return null; }
          })
          .filter(Boolean);

        if (!connectors.length) return null;

        return (
          <div key={group.label}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              {group.label}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {connectors.map(connector => {
                if (!connector) return null;
                const { meta } = connector;
                const isSelected = selected === meta.id;
                return (
                  <button
                    key={meta.id}
                    onClick={() => onSelect(meta.id)}
                    className={[
                      'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span className="text-2xl shrink-0">{meta.logo}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{meta.displayName}</div>
                      <div className="text-xs text-gray-400">
                        {meta.availableCategories.length} catégorie{meta.availableCategories.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-auto text-indigo-500 text-sm font-bold">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Autre / Import manuel
        </h4>
        <button
          onClick={() => onSelect('zelty')}
          className={[
            'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
            !selected ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300',
          ].join(' ')}
        >
          <span className="text-2xl">📁</span>
          <div>
            <div className="text-sm font-medium text-gray-700">CSV / Excel / PDF</div>
            <div className="text-xs text-gray-400">Import direct ou OCR si fichier scanné</div>
          </div>
        </button>
      </div>
    </div>
  );
}
