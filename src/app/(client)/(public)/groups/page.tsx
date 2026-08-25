'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@ui/Button';
// Suture Nexus

// Extracted Components (Sutured for Grade X Stability)
import { GroupStatCard } from './components/GroupStatCard';
import { EventCard } from './components/EventCard';
// GroupFilters is not yet implemented or imported elsewhere, let's keep it as is but type it correctly if possible
const GroupFilters = (_props: {
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    selectedType: string;
    setSelectedType: (v: string) => void;
    selectedStatus: string;
    setSelectedStatus: (v: string) => void;
}): null => null;

// Constants
import { useGroups } from '@/modules/ops';
import { Calendar, BarChart3, Star } from 'lucide-react';

export default function GroupsPage() {
    const { data: groups, isLoading: _isLoading } = useGroups();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('Tous');
    const [selectedStatus, setSelectedStatus] = useState('Tous');

    const stats = useMemo(() => [
        { label: "Total Groupes", value: groups.length.toString(), icon: Users, change: 0 },
        { label: "Réservations", value: groups.filter(g => g.status === 'confirmed').length.toString(), icon: Calendar, change: 0 },
        { label: "CA Prévisionnel", value: `${(groups.reduce((acc, g) => acc + (g.budget || 0), 0) / 100).toFixed(1)}k€`, icon: BarChart3, change: 0 },
        { label: "Note Moyenne", value: "4.8", icon: Star, change: 0 }
    ], [groups]);

    const filteredGroups = useMemo(() => {
        return groups.filter(group => {
            const matchesSearch = (group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                group.contact?.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesType = selectedType === 'Tous' || group.type === selectedType;
            const matchesStatus = selectedStatus === 'Tous' || group.status === selectedStatus;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [groups, searchQuery, selectedType, selectedStatus]);

    return (
        <div className="flex h-screen -m-4 md:-m-8 flex-col bg-bg-primary overflow-hidden relative font-sans">
            {/* Cinematic Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-action-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-action-primary/5 blur-[100px] rounded-full" />
            </div>

            {/* Header */}
            <div className="relative z-30 pt-10 px-12 pb-8 flex items-center justify-between border-b border-border bg-bg-primary/40 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-action-primary/10 border border-focus/20 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif italic font-black text-text-primary tracking-tight leading-none">
                            Groupes & Événements
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mt-1">
                            Gérez vos réservations de groupe et privatisions
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        className="h-12 px-8 bg-action-primary text-text-primary hover:bg-action-primary rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-[0_8px_24px_rgba(168,85,247,0.25)] transition-all flex items-center gap-3"
                        id="groups-create-button"
                    >
                        <Plus className="w-4 h-4" />
                        Nouveau Groupe
                    </Button>
                    <Link href="/dashboard">
                        <button className="w-12 h-12 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center hover:bg-bg-secondary transition-all group">
                            <X className="w-5 h-5 text-text-muted group-hover:text-text-primary" />
                        </button>
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col px-12 pt-8">
                <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, idx) => (
                        <GroupStatCard key={idx} stat={stat} />
                    ))}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <GroupFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedType={selectedType}
                        setSelectedType={setSelectedType}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                    />

                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-12">
                        <div className="grid grid-cols-1 gap-6" id="groups-list">
                            <AnimatePresence mode="popLayout">
                                {filteredGroups.map(group => (
                                    <EventCard key={group.id} group={group} />
                                ))}
                            </AnimatePresence>
                        </div>

                        {filteredGroups.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                                id="groups-empty-state"
                            >
                                <div className="w-20 h-20 rounded-full bg-bg-secondary border border-border flex items-center justify-center mb-6">
                                    <Users className="w-10 h-10 text-text-muted opacity-20" />
                                </div>
                                <h3 className="text-xl font-serif italic font-black text-text-primary mb-2">Aucun groupe trouvé</h3>
                                <p className="text-sm text-text-muted max-w-sm">
                                    Ajustez vos filtres ou effectuez une nouvelle recherche pour trouver ce que vous cherchez.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
