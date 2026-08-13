'use client';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import type { PlatformVariant } from '@nexus/contracts';

export interface SimpleTable {
  id: string;
  x: number;
  y: number;
  capacity: number;
  label: string;
  shape: 'round' | 'rect';
}

export interface SimpleZone {
  id: string;
  name: string;
  color: string;
}

interface SimpleFloorPlanEditorProps {
  onSave: (tables: SimpleTable[], zones: SimpleZone[]) => void;
  variant?: PlatformVariant;
}

const RESTAURANT_TEMPLATES = [
  {
    name: 'Bistrot 20 couverts',
    tables: [
      { id: 't1', x: 80,  y: 80,  capacity: 2, label: '1', shape: 'round' as const },
      { id: 't2', x: 180, y: 80,  capacity: 2, label: '2', shape: 'round' as const },
      { id: 't3', x: 280, y: 80,  capacity: 2, label: '3', shape: 'round' as const },
      { id: 't4', x: 80,  y: 180, capacity: 4, label: '4', shape: 'rect' as const },
      { id: 't5', x: 220, y: 180, capacity: 4, label: '5', shape: 'rect' as const },
      { id: 't6', x: 80,  y: 280, capacity: 4, label: '6', shape: 'rect' as const },
      { id: 't7', x: 220, y: 280, capacity: 4, label: '7', shape: 'rect' as const },
    ],
    zones: [{ id: 'z1', name: 'Salle', color: '#EFF6FF' }],
  },
  {
    name: 'Restaurant 40 couverts',
    tables: [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `tr${i + 1}`, x: 80 + i * 100, y: 80, capacity: 4, label: String(i + 1), shape: 'rect' as const,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `tr${i + 6}`, x: 80 + i * 100, y: 200, capacity: 4, label: String(i + 6), shape: 'rect' as const,
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: `tr${i + 11}`, x: 130 + i * 200, y: 320, capacity: 6, label: String(i + 11), shape: 'rect' as const,
      })),
    ],
    zones: [
      { id: 'z1', name: 'Salle principale', color: '#EFF6FF' },
      { id: 'z2', name: 'Terrasse', color: '#F0FDF4' },
    ],
  },
  {
    name: 'Brasserie 80 couverts',
    tables: Array.from({ length: 16 }, (_, i) => ({
      id: `tb${i + 1}`, x: 60 + (i % 4) * 130, y: 60 + Math.floor(i / 4) * 110, capacity: 5, label: String(i + 1), shape: 'rect' as const,
    })),
    zones: [
      { id: 'z1', name: 'Salle', color: '#EFF6FF' },
      { id: 'z2', name: 'Bar', color: '#FEF3C7' },
    ],
  },
];

const HOTEL_TEMPLATES = [
  {
    name: 'Hôtel 20 chambres',
    tables: Array.from({ length: 10 }, (_, i) => ({
      id: `h${i + 1}`, x: 80 + (i % 5) * 110, y: 80 + Math.floor(i / 5) * 110, capacity: 2, label: String(i + 1), shape: 'rect' as const,
    })),
    zones: [{ id: 'z1', name: 'Étage 1', color: '#EFF6FF' }, { id: 'z2', name: 'Étage 2', color: '#F0FDF4' }],
  },
];

const GARAGE_TEMPLATES = [
  {
    name: 'Atelier 5 baies',
    tables: Array.from({ length: 5 }, (_, i) => ({
      id: `b${i + 1}`, x: 80 + i * 120, y: 100, capacity: 1, label: `Baie ${i + 1}`, shape: 'rect' as const,
    })),
    zones: [{ id: 'z1', name: 'Atelier principal', color: '#FEF3C7' }],
  },
];

const SALON_TEMPLATES = [
  {
    name: 'Salon 6 postes',
    tables: Array.from({ length: 6 }, (_, i) => ({
      id: `p${i + 1}`, x: 80 + (i % 3) * 130, y: 80 + Math.floor(i / 3) * 130, capacity: 1, label: `Poste ${i + 1}`, shape: 'circle' as const,
    })),
    zones: [{ id: 'z1', name: 'Salle principale', color: '#FDF4FF' }],
  },
];

const TEMPLATES_BY_VARIANT: Partial<Record<PlatformVariant, typeof RESTAURANT_TEMPLATES>> = {
  restaurant: RESTAURANT_TEMPLATES,
  bakery:     RESTAURANT_TEMPLATES,
  hotel:      HOTEL_TEMPLATES,
  garage:     GARAGE_TEMPLATES,
  salon:      SALON_TEMPLATES,
  clinic:     SALON_TEMPLATES,
};

const ZONE_COLORS = ['#EFF6FF', '#F0FDF4', '#FEF3C7', '#FDF4FF', '#FFF1F2'];

export function SimpleFloorPlanEditor({ onSave, variant = 'restaurant' }: SimpleFloorPlanEditorProps) {
  const TEMPLATES = useMemo(
    () => TEMPLATES_BY_VARIANT[variant] ?? RESTAURANT_TEMPLATES,
    [variant],
  );
  const [tables, setTables] = useState<SimpleTable[]>([]);
  const [zones, setZones] = useState<SimpleZone[]>([{ id: 'z1', name: 'Salle', color: '#EFF6FF' }]);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [templateApplied, setTemplateApplied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setTables(t.tables);
    setZones(t.zones);
    setTemplateApplied(true);
  };

  const addTable = () => {
    const id = `t${Date.now()}`;
    setTables(prev => [...prev, {
      id, x: 100 + Math.random() * 200, y: 100 + Math.random() * 150, capacity: 4, label: String(prev.length + 1), shape: 'rect',
    }]);
  };

  const addZone = () => {
    const id = `z${Date.now()}`;
    const color = ZONE_COLORS[zones.length % ZONE_COLORS.length];
    setZones(prev => [...prev, { id, name: `Zone ${prev.length + 1}`, color }]);
  };

  const removeTable = (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    if (selected === id) setSelected(null);
  };

  const updateTable = (id: string, patch: Partial<SimpleTable>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const onMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelected(id);
    const table = tables.find(t => t.id === id);
    if (!table) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({ id, offsetX: e.clientX - rect.left - table.x, offsetY: e.clientY - rect.top - table.y });
  }, [tables]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(560, e.clientX - rect.left - dragging.offsetX));
    const y = Math.max(0, Math.min(360, e.clientY - rect.top - dragging.offsetY));
    setTables(prev => prev.map(t => t.id === dragging.id ? { ...t, x, y } : t));
  }, [dragging]);

  const selectedTable = tables.find(t => t.id === selected);

  return (
    <div className="space-y-4">
      {!templateApplied && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Choisissez un template de départ ou créez votre plan de zéro :</p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => applyTemplate(tpl)}
                className="p-3 border-2 border-gray-200 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-50 transition-all"
              >
                <div className="text-lg mb-1">🪑</div>
                <div className="text-xs font-medium text-gray-700">{tpl.name}</div>
                <div className="text-xs text-gray-400">{tpl.tables.length} tables · {tpl.zones.length} zones</div>
              </button>
            ))}
            <button
              onClick={() => setTemplateApplied(true)}
              className="p-3 border-2 border-dashed border-gray-300 rounded-xl text-left hover:border-indigo-300 transition-all"
            >
              <div className="text-lg mb-1">✏️</div>
              <div className="text-xs font-medium text-gray-700">Plan personnalisé</div>
              <div className="text-xs text-gray-400">Partir de zéro</div>
            </button>
          </div>
        </div>
      )}

      {templateApplied && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={addTable} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
              + Table
            </button>
            <button onClick={addZone} className="px-3 py-1.5 border border-indigo-300 text-indigo-600 text-xs rounded-lg hover:bg-indigo-50 transition-colors">
              + Zone
            </button>
            <button
              onClick={() => { setTemplateApplied(false); setTables([]); setZones([{ id: 'z1', name: 'Salle', color: '#EFF6FF' }]); }}
              className="px-3 py-1.5 border border-gray-300 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors"
            >
              Changer de template
            </button>
            <span className="text-xs text-gray-400 ml-auto">{tables.length} table{tables.length > 1 ? 's' : ''} · {tables.reduce((s, t) => s + t.capacity, 0)} couverts</span>
          </div>

          {/* Zone labels */}
          {zones.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {zones.map(z => (
                <div key={z.id} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: z.color }} />
                  <input
                    className="text-xs border-b border-dashed border-gray-300 bg-transparent outline-none w-24"
                    value={z.name}
                    onChange={(e) => setZones(prev => prev.map(zone => zone.id === z.id ? { ...zone, name: e.target.value } : zone))}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="relative rounded-xl border-2 border-gray-200 bg-gray-50 overflow-hidden cursor-crosshair select-none"
            style={{ height: 420 }}
            onMouseMove={onMouseMove}
            onMouseUp={() => setDragging(null)}
            onMouseLeave={() => setDragging(null)}
            onClick={() => setSelected(null)}
          >
            {/* Zone backgrounds */}
            {zones.map((z, i) => (
              <div
                key={z.id}
                className="absolute rounded-lg text-xs font-medium text-gray-400 p-2"
                style={{
                  left: i === 0 ? 0 : '50%',
                  top: 0,
                  width: zones.length > 1 ? '50%' : '100%',
                  height: '100%',
                  backgroundColor: z.color,
                  opacity: 0.6,
                }}
              >
                {z.name}
              </div>
            ))}

            {/* Tables */}
            {tables.map(table => (
              <div
                key={table.id}
                onMouseDown={(e) => onMouseDown(e, table.id)}
                className={[
                  'absolute flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow',
                  table.shape === 'round' ? 'rounded-full' : 'rounded-lg',
                  selected === table.id ? 'ring-2 ring-indigo-500 shadow-lg' : 'shadow-sm hover:shadow-md',
                ].join(' ')}
                style={{
                  left: table.x, top: table.y,
                  width: table.shape === 'round' ? 56 : 72,
                  height: table.shape === 'round' ? 56 : 52,
                  backgroundColor: selected === table.id ? '#EEF2FF' : '#FFFFFF',
                  border: `2px solid ${selected === table.id ? '#6366F1' : '#D1D5DB'}`,
                  zIndex: selected === table.id ? 10 : 1,
                }}
              >
                <div className="text-center">
                  <div className="text-xs font-bold text-gray-700">{table.label}</div>
                  <div className="text-[10px] text-gray-400">{table.capacity}p</div>
                </div>
              </div>
            ))}

            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                Cliquez sur « + Table » pour commencer
              </div>
            )}
          </div>

          {/* Inspector */}
          {selectedTable && (
            <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm">
              <span className="font-medium text-indigo-800">Table sélectionnée :</span>
              <label className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600">Label</span>
                <input
                  className="w-16 border border-indigo-300 rounded px-2 py-1 text-xs"
                  value={selectedTable.label}
                  onChange={(e) => updateTable(selectedTable.id, { label: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600">Couverts</span>
                <input
                  type="number" min={1} max={20}
                  className="w-14 border border-indigo-300 rounded px-2 py-1 text-xs"
                  value={selectedTable.capacity}
                  onChange={(e) => updateTable(selectedTable.id, { capacity: Number(e.target.value) })}
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600">Forme</span>
                <select
                  className="border border-indigo-300 rounded px-2 py-1 text-xs"
                  value={selectedTable.shape}
                  onChange={(e) => updateTable(selectedTable.id, { shape: e.target.value as 'round' | 'rect' })}
                >
                  <option value="rect">Rectangulaire</option>
                  <option value="round">Ronde</option>
                </select>
              </label>
              <button
                onClick={() => removeTable(selectedTable.id)}
                className="ml-auto px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs hover:bg-red-100 transition-colors"
              >
                Supprimer
              </button>
            </div>
          )}

          <button
            onClick={() => onSave(tables, zones)}
            disabled={tables.length === 0}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✓ Enregistrer le plan de salle ({tables.length} table{tables.length > 1 ? 's' : ''})
          </button>
        </>
      )}
    </div>
  );
}
