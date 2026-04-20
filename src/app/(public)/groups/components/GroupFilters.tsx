// @ts-nocheck
"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { GROUP_TYPES, STATUS_TYPES } from "@/app/(public)/groups/constants";

export function GroupFilters({
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedStatus,
    setSelectedStatus
}: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedType: string;
    setSelectedType: (type: string) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
}) {
    return (
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
            <div className="flex flex-wrap items-center gap-2" id="groups-type-filters">
                {GROUP_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            selectedType === type
                                ? "bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20"
                                : "bg-bg-secondary text-text-muted border-border hover:border-purple-500/30"
                        )}
                        id={`groups-type-filter-${type}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 xl:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-purple-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher un groupe, un contact..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-6 rounded-2xl bg-bg-secondary border border-border focus:border-purple-500/50 outline-none text-sm transition-all"
                        id="groups-search-input"
                    />
                </div>

                <div className="flex items-center gap-1.5 p-1.5 bg-bg-secondary rounded-2xl border border-border" id="groups-status-filters">
                    {STATUS_TYPES.map(status => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                selectedStatus === status
                                    ? "bg-bg-tertiary text-text-primary shadow-sm"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                            id={`groups-status-filter-${status}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <button className="w-12 h-12 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center hover:bg-bg-tertiary transition-all">
                    <SlidersHorizontal className="w-5 h-5 text-text-muted" />
                </button>
            </div>
        </div>
    );
}
