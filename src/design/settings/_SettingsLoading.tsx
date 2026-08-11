"use client";

/** Skeleton de chargement partagé par les panneaux de réglages (lazy) et le Suspense de la page. */
export function SettingsLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-64 rounded-[2.5rem] bg-surface-card" />
            <div className="grid grid-cols-2 gap-8">
                <div className="h-48 rounded-[2.5rem] bg-surface-card" />
                <div className="h-48 rounded-[2.5rem] bg-surface-card" />
            </div>
        </div>
    );
}
