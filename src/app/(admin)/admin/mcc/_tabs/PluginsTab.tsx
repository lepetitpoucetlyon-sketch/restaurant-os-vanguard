'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '@nexus/guards/admin/mcc';

const PluginEnginePanel    = dynamic(() => import('@nexus/guards/admin/mcc/PluginEnginePanel').then(m => m.PluginEnginePanel), { loading: () => <MCCWidgetSkeleton /> });
const PluginCatalogManager = dynamic(() => import('@nexus/guards/admin/mcc/PluginCatalogManager').then(m => m.PluginCatalogManager), { loading: () => <MCCWidgetSkeleton /> });

export function PluginsTab() {
    return (
        <div className="space-y-8">
            <PluginEnginePanel />
            <PluginCatalogManager />
        </div>
    );
}
