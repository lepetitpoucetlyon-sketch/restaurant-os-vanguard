'use client';

/**
 * 📦 DashboardWidgetGrid — Grille de widgets personnalisable.
 *
 * Affiche la sélection de widgets actifs d'un tableau de bord.
 * Permet le masquage/affichage et s'adapte automatiquement au viewport.
 */

import React from 'react';
import { cn } from '@/lib/ui.foundations';
import { WIDGET_MANIFESTS } from './types';
import { LiveRevenueWidget, WeatherWidget, ProbeWidget, ReviewsWidget } from './components/WidgetSamples';

const WIDGET_COMPONENTS: Record<string, React.ComponentType<{ tenantId: string; className?: string }>> = {
    widget_live_revenue: LiveRevenueWidget,
    widget_terrace_weather: WeatherWidget,
    widget_haccp_probe: ProbeWidget,
    widget_google_reviews: ReviewsWidget,
};

interface DashboardWidgetGridProps {
    tenantId: string;
    enabledWidgetIds?: string[];
    className?: string;
}

export function DashboardWidgetGrid({
    tenantId,
    enabledWidgetIds = ['widget_live_revenue', 'widget_terrace_weather', 'widget_haccp_probe', 'widget_google_reviews'],
    className,
}: DashboardWidgetGridProps) {
    const activeManifests = WIDGET_MANIFESTS.filter((m) => enabledWidgetIds.includes(m.id));

    return (
        <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full', className)}>
            {activeManifests.map((manifest) => {
                const Component = WIDGET_COMPONENTS[manifest.id];
                if (!Component) return null;

                return (
                    <div
                        key={manifest.id}
                        data-widget-id={manifest.id}
                        className="h-full min-h-[160px]"
                    >
                        <Component tenantId={tenantId} />
                    </div>
                );
            })}
        </div>
    );
}
