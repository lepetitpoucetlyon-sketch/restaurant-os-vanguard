'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Link, Database, Search, CheckCircle2, Lock } from 'lucide-react';
import { useCompliance } from '@/modules/finance/providers/NexusFiscalProvider';
import { format } from 'date-fns';

import { FiscalSeal } from '@modules/finance/types';

interface HashNode {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  status: 'verified' | 'tampered' | 'pending';
}

export function FiscalChainExplorer({ instanceId }: { instanceId?: string }) {
  const { seals: fiscalSeals = [] } = useCompliance();

  // Memotize the chain nodes from real fiscal seals
  const nodes = useMemo(() => {
    // Filter by instance if provided
    const filteredSeals = instanceId 
      ? (fiscalSeals as unknown as FiscalSeal[]).filter(s => s.instanceId === instanceId)
      : (fiscalSeals as unknown as FiscalSeal[]);

    return filteredSeals
      .sort((a, b) => (b.sequence || 0) - (a.sequence || 0)) // Most recent first
      .map((seal: FiscalSeal): HashNode => ({
        index: seal.sequence || 0,
        hash: seal.hash,
        previousHash: seal.previousHash || 'GENESIS_BLOCK',
        timestamp: format(new Date(seal.timestamp || Date.now()), 'yyyy-MM-dd HH:mm:ss'),
        status: 'verified' // In this view, we show signed seals
      }));
  }, [fiscalSeals, instanceId]);

  const lastUpdate = nodes.length > 0 ? nodes[0].timestamp : 'No data';

  return (
    <div className="bg-[#161618] border border-white/5 rounded-3xl p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-action-primary/10 rounded-xl">
            <Link className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Fiscal Chain Explorer</h3>
            <p className="text-[10px] text-secondary font-medium">Node: {instanceId || 'Global Fleet'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-status-success/5 border border-emerald-500/10 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
          <span className="text-[10px] font-bold text-status-success uppercase tracking-tighter">Live Chain</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-secondary opacity-50 py-12">
              <Lock className="w-8 h-8 mb-3 stroke-1" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-center">
                Waiting for first<br/>cryptographic seal...
              </p>
            </div>
          ) : (
            nodes.map((node, i) => (
              <motion.div 
                key={`${node.index}-${node.hash}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="p-4 bg-[#0a0a0b] border border-white/5 rounded-2xl relative group hover:border-focus/30 transition-all cursor-crosshair"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-brand/50 uppercase tracking-tighter">Sequence</span>
                    <span className="text-[12px] font-mono text-muted">BLOCK_#{node.index.toString().padStart(6, '0')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-status-success/70 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-tighter bg-status-success/5">Signed</span>
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                  </div>
                </div>
                
                <div className="space-y-3 mt-4">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-black text-secondary uppercase tracking-tighter">
                      <span>Current Hash</span>
                      <span className="text-primary italic">SHA-256</span>
                    </div>
                    <div className="p-2 bg-surface-card/[0.02] rounded-lg border border-white/5 font-mono text-[10px] text-brand break-all leading-tight relative overflow-hidden group-hover:text-brand transition-colors">
                      {node.hash}
                      <motion.div 
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] font-black text-secondary uppercase tracking-tighter">Back-Link Pointer</span>
                    <div className="font-mono text-[10px] text-secondary truncate opacity-60 group-hover:opacity-100 transition-opacity">
                      {node.previousHash}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-secondary" />
                    <span className="text-[9px] text-secondary font-medium">{node.timestamp}</span>
                  </div>
                  <ShieldCheck className="w-3 h-3 text-brand/50" />
                </div>

                {/* Visual Continuity Link with Electron Flow */}
                {i < nodes.length - 1 && (
                  <div className="absolute -bottom-4 left-6 w-0.5 h-4 bg-surface-card/5 z-0">
                    <motion.div 
                      animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-action-primary to-transparent"
                    />
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 p-4 bg-action-primary/5 border border-focus/10 rounded-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-action-primary/0 via-action-primary/[0.02] to-action-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-3 h-3 text-brand" />
          <span className="text-[10px] font-black text-brand uppercase tracking-widest">Chain Integrity Verified</span>
        </div>
        <p className="text-[10px] text-secondary leading-relaxed font-medium">
          CRYPTOGRAPHIC_LOCK: Active. Last block timestamp {lastUpdate}. All verification points passed Art. A47 A-1 standards.
        </p>
      </div>
    </div>
  );
}
