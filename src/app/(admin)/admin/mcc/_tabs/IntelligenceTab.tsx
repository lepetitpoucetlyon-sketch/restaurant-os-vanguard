'use client';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton, DeviceManagerPanel } from '../components';

const StrategyOracle = dynamic(() => import('../components/StrategyOracle').then(m => m.StrategyOracle), { loading: () => <MCCWidgetSkeleton /> });
const AIWorkshop     = dynamic(() => import('../components/AIWorkshop').then(m => m.AIWorkshop), { loading: () => <MCCWidgetSkeleton /> });
const SupportAIPanel = dynamic(() => import('../components/SupportAIPanel').then(m => m.SupportAIPanel), { loading: () => <MCCWidgetSkeleton /> });

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
