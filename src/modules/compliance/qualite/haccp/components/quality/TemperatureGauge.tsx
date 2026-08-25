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
    idle: 'text-muted bg-surface-tertiary',
    ok: 'text-status-success bg-status-success border-emerald-200',
    warning: 'text-status-warning bg-status-warning border-amber-200',
    critical: 'text-status-danger bg-status-danger border-rose-200',
  };

  return (
    <div className={`relative p-6 rounded-3xl border-2 transition-all duration-500 ${colors[status]} overflow-hidden shadow-sm`}>
      {/* Background Pulse for Sensing */}
      {isSensing && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-action-primary pointer-events-none"
        />
      )}

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${status === 'idle' ? 'bg-surface-bg' : 'bg-surface-card/80 shadow-sm'}`}>
            <Thermometer className="w-5 h-5" />
          </div>
          <span className="font-black text-nano tracking-widest uppercase opacity-70">
            Sonde IoT Bluetooth
          </span>
        </div>
        
        {isSensing && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-action-primary text-brand text-nano font-black tracking-tighter shadow-sm border border-focus">
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
        <div className="h-2 w-full bg-surface-sidebar/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: currentValue !== undefined ? '100%' : '0%' }}
            className={`h-full ${
              status === 'ok' ? 'bg-status-success' : 
              status === 'warning' ? 'bg-status-warning' : 
              status === 'critical' ? 'bg-status-danger' : 'bg-surface-tertiary'
            }`}
          />
        </div>
        <div className="flex justify-between text-nano font-black opacity-40 tracking-widest">
          <span>{target.min}{unit}</span>
          <span className="text-nano">HACCP ZONE</span>
          <span>{target.max}{unit}</span>
        </div>
      </div>

      {status !== 'idle' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 text-nano font-black tracking-widest relative z-10"
        >
          {status === 'ok' ? (
            <><CheckCircle2 className="w-4 h-4 text-status-success" /> CONFORME</>
          ) : (
            <><AlertTriangle className="w-4 h-4 text-status-danger" /> HORS SEUIL</>
          )}
        </motion.div>
      )}
    </div>
  );
};
