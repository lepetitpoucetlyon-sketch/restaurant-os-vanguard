"use client";

import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { qualityActiveControlAtom } from '../../store/qualityAtoms';
import { QualityControlItem, DecisionType } from '@nexus/contracts';
import { cn } from "@/lib/ui.foundations";
import { CheckCircle2, AlertTriangle, XOctagon, Thermometer, Box } from 'lucide-react';
import { Button } from "@ui/button";

interface DeliveryItemRowProps {
  item: QualityControlItem;
  index: number;
}

/**
 * 🥩 DeliveryItemRow - HACCP Field Agent
 * Granular control for individual food items.
 */
export function DeliveryItemRow({ item, index }: DeliveryItemRowProps) {
  const session = useAtomValue(qualityActiveControlAtom);
  const setSession = useSetAtom(qualityActiveControlAtom);

  const updateItemStatus = (decision: DecisionType) => {
    if (!session) return;
    const newItems = [...(session.items || [])];
    newItems[index] = { ...newItems[index], decision };
    setSession(s => s ? { ...s, items: newItems } : null);
  };

  const updateItemTemp = (val: string) => {
    if (!session) return;
    const temp = parseFloat(val);
    const newItems = [...(session.items || [])];
    const status = isTempCompliant(temp, item.checks.temperature.target) ? 'pass' : 'fail';
    
    newItems[index] = { 
      ...newItems[index], 
      checks: { 
        ...newItems[index].checks, 
        temperature: { ...newItems[index].checks.temperature, measured: temp, status } 
      } 
    };
    setSession(s => s ? { ...s, items: newItems } : null);
  };

  const isTempCompliant = (t: number, target: { min: number, max: number }) => t >= target.min && t <= target.max;

  const _statusColor = item.decision === 'accepted' ? "text-success" : item.decision === 'rejected' ? "text-error" : "text-warning";

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-bg-tertiary/20 rounded-[1.5rem] border border-border hover:border-accent-gold/50 transition-all gap-4 mb-3">
      <div className="flex items-center gap-4 flex-1">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-sm font-serif font-black",
          "bg-bg-tertiary text-text-primary border border-border"
        )}>
          {item.product_name.charAt(0)}
        </div>
        <div>
          <h4 className="font-bold text-sm tracking-tight text-text-primary uppercase">{item.product_name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-mono text-text-muted">ID: {item.product_id.slice(0, 8)}</span>
            <span className="text-[8px] font-black uppercase text-accent-gold bg-accent-gold/10 px-1.5 py-0.5 rounded-md">{item.product_category}</span>
          </div>
        </div>
      </div>

      {/* Temperature Control */}
      {item.checks.temperature.required && (
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-card dark:bg-surface-sidebar/20 rounded-xl border border-border">
          <Thermometer className={cn("w-4 h-4", item.checks.temperature.status === 'fail' ? "text-error" : "text-success")} />
          <div className="flex items-end gap-1">
            <input 
              type="number"
              value={item.checks.temperature.measured || ''}
              onChange={(e) => updateItemTemp(e.target.value)}
              placeholder="0.0"
              className="w-12 bg-transparent text-lg font-serif italic font-black outline-none border-b border-border focus:border-accent-gold transition-colors"
            />
            <span className="text-[8px] font-black text-text-muted mb-1 uppercase tracking-tighter">°C</span>
          </div>
        </div>
      )}

      {/* Quantity Display */}
      <div className="flex items-center gap-3 px-4 py-2 bg-surface-card dark:bg-surface-sidebar/20 rounded-xl border border-border">
        <Box className="w-4 h-4 text-text-muted" />
        <p className="text-sm font-mono font-bold">{item.quantity_delivered} {item.unit}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          size="icon" 
          variant={item.decision === 'accepted' ? 'default' : 'ghost'} 
          className={cn("h-10 w-10 rounded-xl", item.decision === 'accepted' ? "bg-success hover:bg-success/90" : "bg-success/10 text-success")}
          onClick={() => updateItemStatus('accepted')}
        >
          <CheckCircle2 className="w-5 h-5" />
        </Button>
        <Button 
          size="icon" 
          variant={item.decision === 'accepted_reservation' ? 'default' : 'ghost'} 
          className={cn("h-10 w-10 rounded-xl", item.decision === 'accepted_reservation' ? "bg-warning hover:bg-warning/90" : "bg-warning/10 text-warning")}
          onClick={() => updateItemStatus('accepted_reservation')}
        >
          <AlertTriangle className="w-5 h-5" />
        </Button>
        <Button 
          size="icon" 
          variant={item.decision === 'rejected' ? 'default' : 'ghost'} 
          className={cn("h-10 w-10 rounded-xl", item.decision === 'rejected' ? "bg-error hover:bg-error/90" : "bg-error/10 text-error")}
          onClick={() => updateItemStatus('rejected')}
        >
          <XOctagon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
