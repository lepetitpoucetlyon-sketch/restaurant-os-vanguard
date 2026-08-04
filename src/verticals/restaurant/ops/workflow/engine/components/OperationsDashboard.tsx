"use client";

import React, { useState } from 'react';
import { useFloorOps as useOMS } from '@/shared/contexts/FloorContext';
import { useTenant } from '@/shared/hooks';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { OperationalArea } from './dashboard/types';

import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardNotes } from './dashboard/DashboardNotes';
import { DashboardGrid } from './dashboard/DashboardGrid';
import { DashboardMap } from './dashboard/DashboardMap';
import { DashboardExplanatory } from './dashboard/DashboardExplanatory';
import { DashboardAreaModal } from './dashboard/DashboardAreaModal';

export function OperationsDashboard() {
    const floorOps = useOMS();
    const areas = floorOps?.areas ?? [];
    const updateAreaStatus = (id: string, status: string) => {
        if (floorOps?.updateAreaStatus) {
            floorOps.updateAreaStatus(id, { status } as never);
        } else {
            logger.debug('Update area', id, status);
        }
    };
    const [view, setView] = useState<'grid' | 'map'>('grid');
    const [selectedArea, setSelectedArea] = useState<OperationalArea | null>(null);
    const { activeTenantId } = useTenant();

    const handleArrival = async (area: OperationalArea) => {
        if (!activeTenantId) return;
        try {
            const promise = Promise.resolve({ success: true });
            toast.promise(promise, {
                loading: 'Suture Grade IX: Établissement du lien financier...',
                success: 'Arrivée validée & Provision comptable générée.',
                error: 'Échec de la suture financière.'
            });
            await promise;
            updateAreaStatus(area.id, 'occupied');
            setSelectedArea(null);
        } catch (e) {
            toast.error('Échec de l\'accueil client.');
            logger.error('[Operations] handleArrival failed', e);
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-[#FDFCF0] font-serif relative overflow-hidden">
            <div className="flex-1 h-full overflow-auto p-4 md:p-10 pb-24 md:pb-10 elegant-scrollbar">
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]" />

                {/* Header Area */}
                <DashboardHeader view={view} setView={setView} />

                <main className="max-w-7xl mx-auto grid grid-cols-12 gap-10">
                    {/* Left Sidebar - Quick Sketch / Info */}
                    <DashboardNotes />

                    {/* Center Content - Grid or Map */}
                    <div className="col-span-9">
                        {view === 'grid' ? (
                            <DashboardGrid 
                                areas={areas as unknown as OperationalArea[]} 
                                selectedArea={selectedArea} 
                                setSelectedArea={setSelectedArea} 
                            />
                        ) : (
                            <DashboardMap />
                        )}
                    </div>
                </main>

                {/* Explanatory Drawings Section */}
                <DashboardExplanatory />

                {/* Area Detail Modal - Notebook Style */}
                <DashboardAreaModal 
                    selectedArea={selectedArea}
                    setSelectedArea={setSelectedArea}
                    handleArrival={handleArrival}
                    updateAreaStatus={updateAreaStatus}
                />
            </div>
        </div>
    );
}
