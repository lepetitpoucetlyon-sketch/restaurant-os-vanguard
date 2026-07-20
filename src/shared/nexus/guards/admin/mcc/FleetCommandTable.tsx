import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNexusFleet } from '@/engines/fleet/NexusFleetProvider';
import { authedFetch } from '@/lib/client/authedFetch';
import {
  Activity,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Brain,
  RotateCcw,
  Terminal,
  Lock,
  Wrench,
  RefreshCw,
  ChevronDown,
  Check
} from 'lucide-react';

type StatusFilter = 'ALL' | 'ONLINE' | 'OFFLINE' | 'CRITICAL' | 'MAINTENANCE';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Tous les sites' },
    { value: 'ONLINE', label: 'En ligne' },
    { value: 'OFFLINE', label: 'Hors ligne' },
    { value: 'CRITICAL', label: 'Critique' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
];

const COMMANDER_ACTIONS = [
    { key: 'RESTART',    label: 'Redémarrer',    icon: RefreshCw, danger: false },
    { key: 'SOFT_LOCK',  label: 'Soft Lock',     icon: Wrench,    danger: false },
    { key: 'HARD_LOCK',  label: 'Hard Lock',     icon: Lock,      danger: true  },
];

export function FleetCommandTable() {
    const { instances, isLoading } = useNexusFleet();
    const [reindexing, setReindexing] = useState<Record<string, boolean>>({});
    const [commanding, setCommanding] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [filterOpen, setFilterOpen] = useState(false);
    const [commandMenuId, setCommandMenuId] = useState<string | null>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredInstances = instances.filter(inst => {
        const matchesSearch = !searchQuery.trim() ||
            inst.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inst.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inst.id?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || inst.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleReindex = async (instanceId: string) => {
        setReindexing(prev => ({ ...prev, [instanceId]: true }));
        try {
            await authedFetch('/api/admin/fleet/rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reindex', instanceId }),
            });
        } finally {
            setReindexing(prev => ({ ...prev, [instanceId]: false }));
        }
    };

    const handleCommand = async (instanceId: string, action: string) => {
        setCommandMenuId(null);
        setCommanding(prev => ({ ...prev, [instanceId]: true }));
        try {
            await authedFetch('/api/admin/fleet/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, instanceId }),
            });
        } finally {
            setCommanding(prev => ({ ...prev, [instanceId]: false }));
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-focus/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-focus rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Synchronisation Télémétrie...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0f0f11] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-action-primary/5 to-transparent">
                <div>
                    <h2 className="text-xl font-serif font-black text-white tracking-tighter">Fleet Command Center</h2>
                    <p className="text-[10px] text-secondary uppercase font-bold tracking-widest mt-1">Orchestration en temps réel des actifs de l'empire</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-surface-card/5 rounded-xl border border-white/5 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-secondary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="RECHERCHER UN SITE..."
                            className="bg-transparent border-none outline-none text-[10px] font-bold text-white placeholder:text-secondary w-32"
                        />
                    </div>
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setFilterOpen(o => !o)}
                            className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${
                                statusFilter !== 'ALL'
                                    ? 'bg-action-primary text-white border-focus/40'
                                    : 'bg-action-primary/10 text-brand border-focus/20 hover:bg-action-primary/20'
                            }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            {statusFilter !== 'ALL' ? statusFilter : ''}
                            <ChevronDown className={`w-3 h-3 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {filterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute right-0 top-full mt-2 w-44 bg-[#111113] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                    {STATUS_FILTERS.map(f => (
                                        <button
                                            key={f.value}
                                            onClick={() => { setStatusFilter(f.value); setFilterOpen(false); }}
                                            className="flex items-center justify-between w-full px-4 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors text-left"
                                        >
                                            <span className={statusFilter === f.value ? 'text-brand' : 'text-muted'}>{f.label}</span>
                                            {statusFilter === f.value && <Check className="w-3 h-3 text-brand" />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-card/[0.02]">
                            <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Instance ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Status / Health</th>
                            <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Revenue (24h)</th>
                            <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">HACCP Risk</th>
                            <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Users</th>
                            <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Global Compliance</th>
                            <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">
                                <div className="flex items-center gap-1.5"><Brain className="w-3 h-3" />RAG</div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredInstances.map((instance, idx) => (
                            <motion.tr 
                                key={instance.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="hover:bg-surface-card/[0.03] transition-colors group"
                            >
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white tracking-tight">{instance.name}</span>
                                        <span className="text-[10px] text-secondary font-mono">ID: {instance.id} • {instance.key}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${
                                            instance.status === 'ONLINE' ? 'bg-status-success shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 
                                            instance.status === 'CRITICAL' ? 'bg-error shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse' : 
                                            'bg-status-warning shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                        }`} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-muted">{instance.status}</span>
                                            <div className="w-16 h-1 bg-surface-card/10 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${instance.metrics.healthScore < 70 ? 'bg-error' : 'bg-status-success'}`}
                                                    style={{ width: `${instance.metrics.healthScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end">
                                        {instance.security?.supportAccessGranted ? (
                                            <>
                                                <span className="text-sm font-black text-white">{(instance.metrics.dailyRevenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-card/5 rounded-md border border-white/5 opacity-40">
                                                <span className="text-[9px] font-black text-muted uppercase tracking-widest">PROTÉGÉ</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        {/* 📡 HACCP LIVE BRIDGE */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${instance.metrics.healthScore >= 90 ? 'bg-status-success' : 'bg-status-warning'}`} />
                                                <span className="text-[9px] font-black text-muted uppercase">Sensors {instance.metrics.healthScore}%</span>
                                            </div>
                                            {instance.metrics.healthScore < 95 && (
                                                <div className="flex items-center gap-1.5 text-error">
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Hygiene Drift Detected</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-white">{instance.metrics.activeUsers}</span>
                                        <span className="text-[9px] font-bold text-secondary uppercase tracking-tighter">Sessions</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-card/[0.03] border border-white/5 rounded-lg w-fit">
                                            <ShieldCheck className={`w-3.5 h-3.5 ${instance.security.nf525Certified ? 'text-status-success' : 'text-secondary'}`} />
                                            <span className="text-[9px] font-black uppercase tracking-wider text-muted">NF525 SEALED</span>
                                        </div>
                                    </div>
                                </td>

                                {/* RAG status */}
                                <td className="px-6 py-5">
                                    {instance.rag ? (
                                        <div className="flex flex-col gap-1">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase border w-fit ${
                                                instance.rag.status === 'online'   ? 'bg-status-success/10 text-status-success border-emerald-500/20' :
                                                instance.rag.status === 'indexing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                                                instance.rag.status === 'offline'  ? 'bg-status-danger/10 text-status-danger border-red-500/20' :
                                                'bg-surface-card/5 text-secondary border-white/5'
                                            }`}>
                                                <Brain className="w-2.5 h-2.5" />
                                                {instance.rag.status}
                                            </div>
                                            {instance.rag.documentCount !== undefined && (
                                                <span className="text-[8px] text-secondary font-mono">{instance.rag.documentCount} docs</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[9px] text-secondary font-mono">—</span>
                                    )}
                                </td>

                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleReindex(instance.id)}
                                            disabled={reindexing[instance.id]}
                                            title="Réindexer RAG"
                                            className="p-2.5 rounded-xl bg-surface-card/5 border border-subtle text-muted hover:text-brand hover:border-brand transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                                        >
                                            <RotateCcw className={`w-3.5 h-3.5 ${reindexing[instance.id] ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button className="p-2.5 rounded-xl bg-surface-card/5 border border-subtle text-muted hover:text-white hover:border-default transition-all opacity-0 group-hover:opacity-100">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="relative">
                                            <button
                                                onClick={() => setCommandMenuId(commandMenuId === instance.id ? null : instance.id)}
                                                disabled={commanding[instance.id]}
                                                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-action-primary/10 text-brand border border-focus/20 text-[9px] font-black uppercase tracking-widest hover:bg-action-primary hover:text-white transition-all shadow-lg shadow-indigo-500/10 opacity-0 group-hover:opacity-100 disabled:opacity-40"
                                            >
                                                {commanding[instance.id]
                                                    ? <><RefreshCw className="w-3 h-3 animate-spin" /> EN COURS</>
                                                    : <><Terminal className="w-3 h-3" /> COMMANDER</>
                                                }
                                            </button>
                                            <AnimatePresence>
                                                {commandMenuId === instance.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                                        transition={{ duration: 0.12 }}
                                                        className="absolute right-0 bottom-full mb-2 w-44 bg-[#111113] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                                    >
                                                        <div className="px-3 py-2 border-b border-white/5">
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-secondary">Action sur {instance.name}</p>
                                                        </div>
                                                        {COMMANDER_ACTIONS.map(({ key, label, icon: Icon, danger }) => (
                                                            <button
                                                                key={key}
                                                                onClick={() => handleCommand(instance.id, key)}
                                                                className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors ${danger ? 'text-error hover:bg-red-500/10' : 'text-muted hover:text-white'}`}
                                                            >
                                                                <Icon className="w-3 h-3" />
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-6 bg-surface-card/[0.01] border-t border-white/5 flex items-center justify-between">
                <p className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em]">{filteredInstances.length} site{filteredInstances.length !== 1 ? 's' : ''} affiché{filteredInstances.length !== 1 ? 's' : ''} / {instances.length} total</p>
                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-brand" />
                    <span className="text-[9px] font-black text-muted uppercase">Fleet live</span>
                </div>
            </div>
        </div>
    );
}
