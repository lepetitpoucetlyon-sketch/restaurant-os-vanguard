import React from 'react';
import { motion } from 'framer-motion';

export function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 px-2 flex items-center gap-2 border-b-2 transition-all ${active ? 'border-focus text-white' : 'border-transparent text-secondary hover:text-muted'}`}
    >
      <div className={`${active ? 'text-brand' : 'text-secondary'}`}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="activeTabDot" className="w-1 h-1 rounded-full bg-action-primary" />}
    </button>
  );
}
