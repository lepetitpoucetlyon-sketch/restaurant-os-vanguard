'use client';

import { MapPin } from "lucide-react";
import { PremiumSelect } from "@ui/PremiumSelect";
import { CONTAINER_OPTIONS } from "./prepConstants";
import type { StorageLocation } from "@nexus/contracts";

interface PrepLogisticsGridProps {
    storageLocation: string;
    setStorageLocation: (loc: string) => void;
    containerId: string;
    setContainerId: (id: string) => void;
    activeLocations: StorageLocation[];
}

export function PrepLogisticsGrid({
    storageLocation,
    setStorageLocation,
    containerId,
    setContainerId,
    activeLocations,
}: PrepLogisticsGridProps) {
    return (
        <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
                <label className="flex items-center gap-3 text-nano font-black text-text-primary uppercase tracking-[0.4em] px-2">
                    <MapPin className="w-3.5 h-3.5 text-accent-gold" />
                    ARCHIVE DE STOCKAGE *
                </label>
                <PremiumSelect
                    value={storageLocation}
                    onChange={setStorageLocation}
                    options={activeLocations.filter(l => l.isActive).map(loc => ({
                        value: String(loc.id),
                        label: String(loc.name || '').toUpperCase()
                    }))}
                />
            </div>
            <div className="space-y-4">
                <label className="flex items-center gap-3 text-nano font-black text-text-muted uppercase tracking-[0.4em] px-2">
                    VÉHICULE / CONTENEUR
                </label>
                <PremiumSelect
                    value={containerId}
                    onChange={setContainerId}
                    options={CONTAINER_OPTIONS.map(c => ({
                        value: String(c),
                        label: c?.toUpperCase() || ''
                    }))}
                />
            </div>
        </div>
    );
}
