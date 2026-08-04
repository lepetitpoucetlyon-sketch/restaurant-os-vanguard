'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '../components';

const PluginEnginePanel    = dynamic(() => import('../components/PluginEnginePanel').then(m => m.PluginEnginePanel), { loading: () => <MCCWidgetSkeleton /> });
const PluginCatalogManager = dynamic(() => import('../components/PluginCatalogManager').then(m => m.PluginCatalogManager), { loading: () => <MCCWidgetSkeleton /> });

export function PluginsTab() {
    return (
        <div className="space-y-8">
            <PluginEnginePanel />
            <PluginCatalogManager />
        </div>
    );
}
