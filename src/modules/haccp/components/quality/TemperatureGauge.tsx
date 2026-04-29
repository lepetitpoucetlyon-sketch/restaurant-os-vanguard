'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Thermometer, Bluetooth, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TemperatureGaugeProps {
  value?: number;
  target?: { min: number; max: number };
  isSensing?: boolean;
  unit?: string;
}

export const TemperatureGauge: React.FC<TemperatureGaugeProps> = ({
  value: initialValue,
  target = { min: 0, max: 4 },
  isSensing = false,
  unit = '°C'
}) => {
  const [currentValue, setCurrentValue] = useState<number | undefined>(initialValue);

  // Sync state with prop updates without triggering cascading renders
  if (!isSensing && currentValue !== initialValue) {
      setCurrentValue(initialValue);
  }

  // 🛰️ LIVE SENSOR SIMULATION (IoT Drift)
  useEffect(() => {
    if (!isSensing || initialValue === undefined) return;

    const interval = setInterval(() => {
      setCurrentValue(prev => {
        if (prev === undefined) return initialValue;
        // Deterministic drift simulation
        const time = Date.now() / 2000;
        const drift = Math.sin(time) * 0.1;
        return Number((initialValue + drift).toFixed(1));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSensing, initialValue]);

  const status = useMemo(() => {
    if (currentValue === undefined) return 'idle';
    if (currentValue >= target.min && currentValue <= target.max) return 'ok';
    if (Math.abs(currentValue - target.max) <= 2 || Math.abs(currentValue - target.min) <= 2) return 'warning';
    return 'critical';
  }, [currentValue, target]);

  const colors = {
    idle: 'text-slate-400 bg-slate-100',
    ok: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    warning: 'text-amber-500 bg-amber-50 border-amber-200',
    critical: 'text-rose-500 bg-rose-50 border-rose-200',
  };

  return (
    <div className={`relative p-6 rounded-3xl border-2 transition-all duration-500 ${colors[status]} overflow-hidden shadow-sm`}>
      {/* Background Pulse for Sensing */}
      {isSensing && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-blue-400 pointer-events-none"
        />
      )}

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${status === 'idle' ? 'bg-slate-200' : 'bg-white/80 shadow-sm'}`}>
            <Thermometer className="w-5 h-5" />
          </div>
          <span className="font-black text-[10px] tracking-widest uppercase opacity-70">
            Sonde IoT Bluetooth
          </span>
        </div>
        
        {isSensing && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-[10px] font-black tracking-tighter shadow-sm border border-blue-200">
            <Bluetooth className="w-3 h-3 animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-4xl font-black tabular-nums tracking-tighter italic">
          {currentValue !== undefined ? currentValue.toFixed(1) : '--.-'}
        </span>
        <span className="text-xl font-bold opacity-40 italic">{unit}</span>
      </div>

      <div className="mt-4 flex flex-col gap-2 relative z-10">
        <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: currentValue !== undefined ? '100%' : '0%' }}
            className={`h-full ${
              status === 'ok' ? 'bg-emerald-500' : 
              status === 'warning' ? 'bg-amber-500' : 
              status === 'critical' ? 'bg-rose-500' : 'bg-slate-300'
            }`}
          />
        </div>
        <div className="flex justify-between text-[10px] font-black opacity-40 tracking-widest">
          <span>{target.min}{unit}</span>
          <span className="text-[9px]">HACCP ZONE</span>
          <span>{target.max}{unit}</span>
        </div>
      </div>

      {status !== 'idle' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 text-[10px] font-black tracking-widest relative z-10"
        >
          {status === 'ok' ? (
            <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> CONFORME</>
          ) : (
            <><AlertTriangle className="w-4 h-4 text-rose-500" /> HORS SEUIL</>
          )}
        </motion.div>
      )}
    </div>
  );
};
