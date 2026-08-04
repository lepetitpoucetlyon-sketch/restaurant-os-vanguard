'use client';

import React from 'react';
import { QualityControlItem } from '@/modules/compliance';
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
          ? 'bg-status-danger border-rose-200 opacity-80' 
          : isHealthy 
            ? 'bg-surface-card border-subtle hover:border-emerald-200 hover:shadow-lg' 
            : 'bg-status-warning border-amber-200'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-bold text-primary group-hover:text-status-success transition-colors">
            {item.product_name}
          </h4>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
            {item.product_category} • {item.quantity_delivered} {item.unit}
          </span>
        </div>
        {item.is_rejected ? (
          <div className="bg-status-danger text-text-primary p-1.5 rounded-lg">
            <AlertOctagon className="w-4 h-4" />
          </div>
        ) : isHealthy ? (
          <div className="bg-status-success text-text-primary p-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        ) : (
          <div className="bg-status-warning text-text-primary p-1.5 rounded-lg">
            <Timer className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-surface-bg text-secondary">
          <Thermometer className={`w-3.5 h-3.5 ${item.checks.temperature.status === 'fail' ? 'text-status-danger' : 'text-muted'}`} />
          <span className="text-xs font-bold tabular-nums">
            {item.checks.temperature.measured !== undefined ? `${item.checks.temperature.measured}°C` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-surface-bg text-secondary">
          <Calendar className={`w-3.5 h-3.5 ${item.is_short_dlc ? 'text-status-warning' : 'text-muted'}`} />
          <span className="text-xs font-bold tabular-nums">
            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {item.is_rejected && (
        <div className="mt-3 pt-3 border-t border-rose-100">
          <p className="text-[10px] font-bold text-status-danger uppercase">
            REFUSÉ : {item.decision_reason || 'Critères non conformes'}
          </p>
        </div>
      )}

      {item.is_short_dlc && !item.is_rejected && (
        <div className="mt-2 text-[8px] font-black tracking-widest text-status-warning bg-status-warning px-2 py-0.5 rounded-full inline-block">
          DLC COURTE ({item.days_until_expiry}j)
        </div>
      )}
    </div>
  );
};
