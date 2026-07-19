"use client";

import React, { useEffect, useState } from "react";
import { authedFetch } from "@/lib/client/authedFetch";
import {
  Bot,
  ShieldCheck,
  Zap,
  Terminal,
  Cpu,
  Network,
  AlertTriangle,
  Map,
  Sparkles,
  RefreshCcw,
  FileCode,
  ShieldAlert
} from "lucide-react";
import { GlassCard } from "@ui/GlassCard";
import { StatCard } from "@ui/StatCard";
import { PageHeader } from "@ui/PageHeader";

interface SentinelReport {
  timestamp: string;
  status: "healthy" | "warning" | "critical";
  metrics: {
    typeSafety: number;
    testCoverage: number;
    architectureHealth: number;
    overallStability: number;
    knowledgeSync: string;
  };
  alerts: Array<{ type: string; message: string }>;
  complexity: {
    godObjects: Array<{ 
      path: string; 
      lines: number; 
      imports: number;
      proposals?: string[];
    }>;
  };
}

export default function AgentIntelligencePage() {
  const [report, setReport] = useState<SentinelReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(0);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await authedFetch('/api/agent/report');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error("Failed to fetch Sentinel report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(() => {
      setPulse((p) => (p + 1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const stability = report?.metrics.overallStability ?? 0;
  const displayStability = Math.max(0, Math.min(100, stability));

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-12 space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Antigravity Intelligence"
          subtitle="Agentic Mission Control & Fleet Orchestration"
          emoji="🛰️"
        />
        <button 
          onClick={fetchReport}
          className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-action-primary transition-colors"
        >
          <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit
        </button>
      </div>

      {/* Hero Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2 flex flex-col justify-center min-h-[300px] border-action-primary relative overflow-hidden">
          {/* Animated Background Pulse */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-action-primary rounded-full blur-[100px] transition-all duration-1000"
            style={{ transform: `translate(-50%, -50%) scale(${1 + pulse/200})` }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-action-primary flex items-center justify-center border border-action-primary">
                  <Bot className="w-10 h-10 text-action-primary animate-pulse" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-bg-secondary flex items-center justify-center ${
                  report?.status === 'critical' ? 'bg-status-danger' : 'bg-status-success'
                }`}>
                  {report?.status === 'critical' ? <ShieldAlert className="w-3 h-3 text-white" /> : <Zap className="w-3 h-3 text-white fill-white" />}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-brand italic text-text-primary">Antigravity Sentinel</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full animate-ping ${
                    report?.status === 'critical' ? 'bg-status-danger' : 'bg-status-success'
                  }`} />
                  <p className={`text-xs font-black uppercase tracking-widest ${
                    report?.status === 'critical' ? 'text-status-danger' : 'text-status-success'
                  }`}>
                    {report?.status === 'critical' ? 'Architectural Decay Detected' : 'System Optimized / Secure'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tighter text-text-muted">
                <span>Cognitive Stability Index</span>
                <span>{displayStability.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1 bg-border/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-in-out ${
                    displayStability < 50 ? 'bg-status-danger' : 'bg-action-primary'
                  }`} 
                  style={{ width: `${displayStability}%` }} 
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                report?.metrics.knowledgeSync === 'synced' ? 'bg-status-success border-emerald-500/20 text-status-success' : 'bg-action-primary border-action-primary text-action-primary'
              }`}>
                <Network className="w-3 h-3" />
                Nexus: {report?.metrics.knowledgeSync ?? 'Syncing...'}
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                (report?.metrics.typeSafety ?? 0) >= 100 ? 'bg-status-success border-emerald-500/20 text-status-success' : 'bg-action-primary border-focus/20 text-action-primary'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                Type Safety: {report?.metrics.typeSafety ?? '--'}%
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-status-warning border border-amber-500/10 rounded-full text-[10px] font-bold text-status-warning uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" />
                Anomalies: {report?.complexity.godObjects.length ?? 0}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <StatCard 
            label="Empire Stability" 
            value={`${displayStability.toFixed(1)}%`} 
            accentColor={displayStability < 70 ? "error" : "success"} 
            trend={{ value: 1.4, direction: displayStability < 70 ? "down" : "up" }}
            emoji="🏛️"
          />
          <StatCard 
            label="Logic Validation" 
            value={`${(report?.metrics.testCoverage ?? 0).toFixed(0)}%`} 
            accentColor="info" 
            emoji="🧪"
          />
          <StatCard 
            label="God Objects" 
            value={report?.complexity.godObjects.length ?? 0} 
            accentColor="warning" 
            emoji="🏗️"
          />
        </div>
      </div>

      {/* Main Mission Timeline & God Objects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard padding="none" className="border-border/40 flex flex-col h-[450px]">
           <div className="p-6 border-b border-border/40 flex items-center justify-between bg-bg-secondary/30">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-4 h-4 text-action-primary" />
                Diagnostic Terminal
              </h3>
              <div className="px-3 py-1 bg-bg-primary border border-border rounded-full text-[9px] font-bold text-text-muted uppercase">
                {report ? `Audit: ${new Date(report.timestamp).toLocaleTimeString()}` : 'Initializing...'}
              </div>
           </div>
           <div className="p-6 font-mono text-[10px] space-y-4 text-text-muted bg-surface-bg dark:bg-surface-bg overflow-y-auto flex-1 custom-scrollbar">
              {report?.alerts.map((alert, i) => (
                <div key={i} className="flex gap-3">
                  <span className={alert.type === 'error' ? 'text-status-danger shrink-0' : 'text-status-warning shrink-0'}>
                    [{alert.type.toUpperCase()}]
                  </span>
                  <p className={alert.type === 'error' ? 'text-status-danger' : 'text-status-warning'}>{alert.message}</p>
                </div>
              ))}
              
              <div className="flex gap-3">
                <span className="text-action-primary shrink-0">[SENTINEL]</span>
                <p>Architectural audit complete. Scanning for "Cognitive Debt"...</p>
              </div>

              {report?.complexity.godObjects.slice(0, 10).map((obj, i) => (
                <div key={i} className="flex flex-col gap-1 pl-4 border-l border-border/20 mb-4">
                  <div className="flex gap-3">
                    <span className="text-text-muted shrink-0 opacity-40">{">>"}</span>
                    <p>
                      <span className="text-text-primary">{obj.path}</span>: 
                      <span className="text-status-danger font-bold ml-2">{obj.lines} lines</span> / 
                      <span className="text-status-warning ml-1">{obj.imports} imports</span>
                    </p>
                  </div>
                  {obj.proposals && obj.proposals.map((prop, pi) => (
                    <div key={pi} className="flex gap-2 pl-6 text-[9px] text-action-primary italic leading-tight">
                      <Network className="w-2 h-2 mt-0.5 shrink-0" />
                      <span>{prop}</span>
                    </div>
                  ))}
                </div>
              ))}
              
              { (report?.complexity.godObjects.length ?? 0) > 10 && (
                 <div className="text-[9px] italic opacity-50 pl-8">
                   ...and {report!.complexity.godObjects.length - 10} more architectural violations.
                 </div>
              )}

              <div className="flex gap-3 animate-pulse pt-4">
                <span className="text-action-primary shrink-0">[_]</span>
                <p>Awaiting refactoring commands to restore Empire Balance.</p>
              </div>
           </div>
        </GlassCard>

        <section className="space-y-6">
           <GlassCard className="bg-bg-secondary border-action-primary">
              <div className="flex items-start gap-4">
                 <div className="p-3 bg-action-primary rounded-xl">
                    <Map className="w-6 h-6 text-action-primary" />
                 </div>
                 <div>
                    <h4 className="font-brand italic text-lg leading-tight">Complexity Debt Identified</h4>
                    <p className="text-sm text-text-muted mt-2 leading-relaxed">
                       Sentinel a identifié <strong>{report?.complexity.godObjects.length ?? 0} violations</strong> de la règle des "500 lignes / 15 imports". Ces nœuds créent une friction cognitive élevée.
                    </p>
                    <div className="mt-6 flex flex-col gap-2">
                       <p className="text-[10px] font-black uppercase text-text-muted">Prochaine action recommandée :</p>
                       <p className="text-sm font-bold text-action-primary italic">
                          {report?.complexity.godObjects[0] ? `"${`Modulariser ${report.complexity.godObjects[0].path} (${report.complexity.godObjects[0].lines} lignes)`}"` : '"Empire Stable"'}
                       </p>
                    </div>
                    <button
                       className="mt-8 w-full px-6 py-3 bg-action-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                       onClick={fetchReport}
                       disabled={loading}
                    >
                       <FileCode className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                       {loading ? "Analyse en cours..." : "Lancer le Refactoring Automatisé"}
                    </button>
                 </div>
              </div>
           </GlassCard>

           <div className="grid grid-cols-2 gap-4">
              <GlassCard padding="md" variant="inset" className="flex flex-col items-center justify-center text-center">
                 <Cpu className="w-5 h-5 text-text-muted mb-2" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Sentinel Clock</span>
                 <p className="font-brand italic text-sm mt-1">Real-time (Active)</p>
              </GlassCard>
              <GlassCard padding="md" variant="inset" className="flex flex-col items-center justify-center text-center">
                 <Sparkles className="w-5 h-5 text-action-primary mb-2" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Empire Health</span>
                 <p className={`font-serif italic text-sm mt-1 ${displayStability < 70 ? 'text-status-danger' : 'text-status-success'}`}>
                    {displayStability < 50 ? 'Critique' : displayStability < 80 ? 'Instable' : 'Parfaite'}
                 </p>
              </GlassCard>
           </div>
        </section>
      </div>
    </div>
  );
}
