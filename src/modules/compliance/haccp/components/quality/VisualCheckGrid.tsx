'use client';

import React from 'react';
import { Palette, Hand, Wind, Package, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CheckItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  ok: boolean;
}

interface VisualCheckGridProps {
  checks: {
    color: boolean;
    texture: boolean;
    odor: boolean;
    packaging: boolean;
  };
  onChange: (key: string, value: boolean) => void;
}

export const VisualCheckGrid: React.FC<VisualCheckGridProps> = ({
  checks,
  onChange
}) => {
  const items = [
    { id: 'color', label: 'Couleur', icon: <Palette className="w-5 h-5" />, ok: checks.color },
    { id: 'texture', label: 'Texture', icon: <Hand className="w-5 h-5" />, ok: checks.texture },
    { id: 'odor', label: 'Odeur', icon: <Wind className="w-5 h-5" />, ok: checks.odor },
    { id: 'packaging', label: 'Packaging', icon: <Package className="w-5 h-5" />, ok: checks.packaging },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {items.map((item) => (
        <div
          key={item.id}
          className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
            item.ok 
              ? 'bg-status-success border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
              : 'bg-surface-card border-subtle'
          }`}
        >
          <div className={`p-3 rounded-xl mb-2 ${item.ok ? 'bg-status-success text-white' : 'bg-surface-bg text-muted'}`}>
            {item.icon}
          </div>
          
          <span className={`text-[10px] font-black tracking-widest uppercase mb-4 ${item.ok ? 'text-status-success' : 'text-secondary'}`}>
            {item.label}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => onChange(item.id, true)}
              className={`p-2 rounded-lg transition-all ${
                item.ok 
                  ? 'bg-status-success text-white scale-110 shadow-lg' 
                  : 'bg-surface-tertiary text-muted hover:bg-status-success hover:text-status-success'
              }`}
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChange(item.id, false)}
              className={`p-2 rounded-lg transition-all ${
                !item.ok 
                  ? 'bg-status-danger text-white scale-110 shadow-lg' 
                  : 'bg-surface-tertiary text-muted hover:bg-status-danger hover:text-status-danger'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {item.ok && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-status-success rounded-full flex items-center justify-center border-2 border-white shadow-sm"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
};
