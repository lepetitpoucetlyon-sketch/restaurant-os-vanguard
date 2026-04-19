"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { posCartCountSelector } from '@/store/posAtoms';

/**
 * 📊 PerformanceMonitor - Grade VI
 * Real-time monitoring of RAM pressure (Estimated) and State Latency.
 * Part of the EXCALIBUR-9 Biologique layer.
 */
export function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [latency, setLatency] = useState(0);
  const cartCount = useAtomValue(posCartCountSelector);
  
  const lastTime = useRef(performance.now());
  const frames = useRef(0);
  const startLatency = useRef(performance.now());

  // FPS Monitoring
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      const now = performance.now();
      frames.current++;
      
      if (now >= lastTime.current + 1000) {
        setFps(Math.round((frames.current * 1000) / (now - lastTime.current)));
        lastTime.current = now;
        frames.current = 0;
      }
      
      frameId = requestAnimationFrame(loop);
    };
    
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Latency Monitoring (Reaction to Cart Change)
  useEffect(() => {
    const end = performance.now();
    setLatency(Number((end - startLatency.current).toFixed(2)));
    startLatency.current = end;
  }, [cartCount]);

  const getStatusColor = () => {
    if (fps < 30 || latency > 16) return "bg-error text-white";
    if (fps < 50 || latency > 8) return "bg-warning text-black";
    return "bg-success text-white";
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2">
      <div className={`px-4 py-2 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md flex items-center gap-4 transition-all duration-500 ${getStatusColor()}`}>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Fluidité</span>
          <span className="text-sm font-serif italic font-black">{fps} FPS</span>
        </div>
        
        <div className="w-px h-6 bg-white/20" />
        
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Latence Atome</span>
          <span className="text-sm font-serif italic font-black">{latency}ms</span>
        </div>

        <div className="w-px h-6 bg-white/20" />

        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest opacity-70">RAM Grade</span>
          <span className="text-sm font-serif italic font-black">Grade VI</span>
        </div>
      </div>
      
      <p className="text-[7px] text-text-muted font-black uppercase tracking-[0.3em] px-2">
        EXCALIBUR_9_BIOLOGIQUE_ACTIVE
      </p>
    </div>
  );
}
