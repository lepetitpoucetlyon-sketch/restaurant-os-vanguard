// @ts-nocheck
// @ts-nocheck
'use client';

import React from 'react';
import { QualityControlItem } from '@/domain/types/quality';
import { Badge } from '@/components/ui/badge'; // Assumes existence of a shadcn-like Badge component
import { Calendar, Thermometer, CheckCircle2, AlertOctagon, Timer } from 'lucide-react';

interface ProductControlCardProps {
  item: QualityControlItem;
  onClick?: () => void;
}

export const ProductControlCard: React.FC<ProductControlCardProps> = ({
  item,
  onClick
}) => {
  const isHealthy = !item.is_rejected && item.checks.temperature.status === 'pass' && item.checks.visual.status === 'pass';

  return (
    <div 
      onClick={onClick}
      className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
        item.is_rejected 
          ? 'bg-rose-50 border-rose-200 opacity-80' 
          : isHealthy 
            ? 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg' 
            : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            {item.product_name}
          </h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {item.product_category} • {item.quantity_delivered} {item.unit}
          </span>
        </div>
        {item.is_rejected ? (
          <div className="bg-rose-500 text-white p-1.5 rounded-lg">
            <AlertOctagon className="w-4 h-4" />
          </div>
        ) : isHealthy ? (
          <div className="bg-emerald-500 text-white p-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        ) : (
          <div className="bg-amber-500 text-white p-1.5 rounded-lg">
            <Timer className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-50 text-slate-600">
          <Thermometer className={`w-3.5 h-3.5 ${item.checks.temperature.status === 'fail' ? 'text-rose-500' : 'text-slate-400'}`} />
          <span className="text-xs font-bold tabular-nums">
            {item.checks.temperature.measured !== undefined ? `${item.checks.temperature.measured}°C` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-50 text-slate-600">
          <Calendar className={`w-3.5 h-3.5 ${item.is_short_dlc ? 'text-amber-500' : 'text-slate-400'}`} />
          <span className="text-xs font-bold tabular-nums">
            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {item.is_rejected && (
        <div className="mt-3 pt-3 border-t border-rose-100">
          <p className="text-[10px] font-bold text-rose-600 uppercase">
            REFUSÉ : {item.decision_reason || 'Critères non conformes'}
          </p>
        </div>
      )}

      {item.is_short_dlc && !item.is_rejected && (
        <div className="mt-2 text-[8px] font-black tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
          DLC COURTE ({item.days_until_expiry}j)
        </div>
      )}
    </div>
  );
};
