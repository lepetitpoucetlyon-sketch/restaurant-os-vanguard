"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, AlertCircle, Info, Database } from 'lucide-react';
import { empireAudit } from '@/lib/audit';
import { cn } from '@/lib/ui.foundations';

interface LogEntry {
    id: string;
    module: string;
    action: string;
    severity: string;
    timestamp: Date;
    details?: import('@/shared/nexus-contract').SovereignValue;
}


export default function MCCAuditStream() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = (empireAudit as any).subscribe((event: any) => {
            const entry: LogEntry = {
                id: Math.random().toString(36).substring(7),
                module: event.module || 'system',
                action: event.action || 'telemetry',
                severity: event.severity || 'info',
                timestamp: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp || Date.now()),
                details: event.details
            };
            setLogs(prev => [entry, ...prev].slice(0, 50));
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [logs]);

    return (
        <div className="bg-[#0a0a0b] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
            {/* Header */}
            <div className="px-6 py-4 bg-[#161618] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Empire Audit Stream</h3>
                        <p className="text-[10px] text-gray-500 font-medium">Real-time Telemetry • Secure Channel</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Live Connection</span>
                </div>
            </div>

            {/* Log Feed */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-2 font-mono scrollbar-hide"
            >
                <AnimatePresence initial={false}>
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                            <Database className="w-8 h-8 mb-2 stroke-1" />
                            <p className="text-[10px] uppercase tracking-widest">Waiting for telemetry data...</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ 
                                    opacity: 1, 
                                    x: 0,
                                    borderLeftColor: (log.severity === 'critical' || log.severity === 'high') ? ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0)'] : 'transparent'
                                }}
                                transition={{ 
                                    duration: 0.5,
                                    borderLeftColor: { repeat: Infinity, duration: 2 }
                                }}
                                className={cn(
                                    "flex items-start gap-4 p-2.5 rounded-xl hover:bg-white/[0.02] transition-all group border-l-2 border-transparent hover:border-white/5",
                                    (log.severity === 'critical' || log.severity === 'high') && "bg-red-500/[0.02]"
                                )}
                            >
                                <div className="mt-1">
                                    <SeverityIcon severity={log.severity} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <motion.span 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-[9px] font-bold text-indigo-500/80 uppercase"
                                        >
                                            [{log.module}]
                                        </motion.span>
                                        <span className="text-[10px] font-medium text-gray-300 group-hover:text-white transition-colors">{log.action}</span>
                                        <span className="text-[9px] text-gray-600 ml-auto">{log.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                    {log.details && (
                                        <p className="text-[9px] text-gray-500 truncate opacity-60 group-hover:opacity-100 transition-opacity">
                                            {JSON.stringify(log.details)}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-[#111113] border-t border-white/5 flex items-center gap-4 relative overflow-hidden">
                <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"
                />
                <div className="flex items-center gap-2 relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">GTM-7X2A9</span>
                </div>
                <div className="w-px h-3 bg-white/5 ml-auto relative z-10" />
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest relative z-10">Buffer Status: {logs.length}/50</span>
            </div>
        </div>
    );
}

function SeverityIcon({ severity }: { severity: string }) {
    switch (severity) {
        case 'critical':
            return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
        case 'high':
            return <Shield className="w-3.5 h-3.5 text-amber-500" />;
        default:
            return <Info className="w-3.5 h-3.5 text-blue-400 opacity-60" />;
    }
}
