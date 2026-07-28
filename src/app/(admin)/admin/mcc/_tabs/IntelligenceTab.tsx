'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton, DeviceManagerPanel } from '@nexus/guards/admin/mcc';

const StrategyOracle = dynamic(() => import('@nexus/guards/admin/mcc/StrategyOracle').then(m => m.StrategyOracle), { loading: () => <MCCWidgetSkeleton /> });
const AIWorkshop     = dynamic(() => import('@nexus/guards/admin/mcc/AIWorkshop').then(m => m.AIWorkshop), { loading: () => <MCCWidgetSkeleton /> });
const SupportAIPanel = dynamic(() => import('@nexus/guards/admin/mcc/SupportAIPanel').then(m => m.SupportAIPanel), { loading: () => <MCCWidgetSkeleton /> });

export function IntelligenceTab() {
    return (
        <div className="space-y-8">
            <StrategyOracle />
            <AIWorkshop />
            <SupportAIPanel />
            <DeviceManagerPanel />
        </div>
    );
}
