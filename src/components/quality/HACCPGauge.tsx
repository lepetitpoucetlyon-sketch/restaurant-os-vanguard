// @ts-nocheck
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/ui.foundations";
import { Thermometer, AlertTriangle, CheckCircle2, XOctagon } from 'lucide-react';

interface HACCPGaugeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  warningBuffer?: number;
  type?: 'temperature' | 'weight';
}

/**
 * 🌡️ HACCPGauge - Industrial Grade
 * Visual verification for food safety limits.
 */
export function HACCPGauge({ 
  label, 
  value, 
  min, 
  max, 
  unit, 
  warningBuffer = 0.5,
  type = 'temperature'
}: HACCPGaugeProps) {
  
  const isOutOfRange = value < min || value > max;
  const isWarning = !isOutOfRange && (value <= min + warningBuffer || value >= max - warningBuffer);
  
  // Calculate percentage for visual bar (clamped 0-100)
  const range = max - min;
  const extendedRange = range * 1.5; // Give some space for out of range
  const center = (min + max) / 2;
  const start = center - (extendedRange / 2);
  const percentage = Math.min(Math.max(((value - start) / extendedRange) * 100, 0), 100);
  
  // Color calculation
  const statusColor = isOutOfRange ? "text-error" : isWarning ? "text-warning" : "text-success";
  const bgColor = isOutOfRange ? "bg-error/10" : isWarning ? "bg-warning/10" : "bg-success/10";
  const borderColor = isOutOfRange ? "border-error" : isWarning ? "border-warning" : "border-success";

  const StatusIcon = isOutOfRange ? XOctagon : isWarning ? AlertTriangle : CheckCircle2;

  return (
    <div className={cn(
      "p-6 rounded-[2rem] border transition-all group",
      borderColor,
      bgColor
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
            statusColor,
            "bg-white dark:bg-black/20"
          )}>
            {type === 'temperature' ? <Thermometer className="w-5 h-5" /> : <StatusIcon className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-bold uppercase text-[10px] tracking-widest text-text-primary">{label}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusIcon className={cn("w-3 h-3", statusColor)} />
              <span className={cn("text-[8px] font-black uppercase tracking-tighter", statusColor)}>
                {isOutOfRange ? "HORS NORMES" : isWarning ? "A SURVEILLER" : "CONFORME"}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-serif italic font-black text-text-primary">{value.toFixed(1)}</span>
          <span className="text-xs font-black text-text-muted ml-1">{unit}</span>
        </div>
      </div>

      {/* Visual Bar */}
      <div className="relative h-2 bg-bg-tertiary rounded-full overflow-hidden mt-4">
        {/* Safety Zone Wrapper */}
        <div className="absolute inset-0 flex justify-center">
            <div className="w-[66%] h-full bg-success/20 rounded-full" />
        </div>
        
        {/* Pointer */}
        <motion.div 
          initial={{ left: "50%" }}
          animate={{ left: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 100 }}
          className={cn("absolute top-0 bottom-0 w-1.5 shadow-sm rounded-full", isOutOfRange ? "bg-error" : "bg-text-primary")}
        />
      </div>
      
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[8px] font-mono text-text-muted">{min}{unit} (min)</span>
        <span className="text-[8px] font-mono text-text-muted">{max}{unit} (max)</span>
      </div>
    </div>
  );
}
