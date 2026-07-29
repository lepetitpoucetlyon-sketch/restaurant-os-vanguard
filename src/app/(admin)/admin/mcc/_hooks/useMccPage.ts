'use client';

import { useState, useEffect } from 'react';
import { ProvisioningEngine } from '@domain/services/ProvisioningEngine';
import { useNexusFleet } from '@/modules/intelligence';
import { useAuth } from '@/shared/providers/NexusCoreProvider';
import type { MCCHealthStatus } from '@/app/api/admin/mcc/health/route';

export const PROV_STEPS = [
    'Vérification DNS & slug…',
    'Provisionnement Registry…',
    'Seeding Config & Templates…',
    'Activation RAG Sovereign…',
] as const;

export function useMccPage() {
    const { instances, globalMetrics, isLoading, refreshFleet } = useNexusFleet();
    const { currentUser } = useAuth();

    const [health, setHealth] = useState<MCCHealthStatus | null>(null);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'fleet' | 'compliance' | 'intelligence' | 'treasury' | 'patchcenter' | 'plugins'>('fleet');
    const [newCloneName, setNewCloneName] = useState('');
    const [newCloneKey, setNewCloneKey] = useState('');
    const [newCloneEmail, setNewCloneEmail] = useState('');
    const [newCloneTier, setNewCloneTier] = useState<'STANDARD' | 'PREMIUM' | 'ENTERPRISE'>('STANDARD');
    const [provisioningStatus, setProvisioningStatus] = useState<string | null>(null);
    const [provisionStep, setProvisionStep] = useState(0);

    useEffect(() => {
        fetch('/api/admin/mcc/health')
            .then(r => r.ok ? r.json() as Promise<MCCHealthStatus> : null)
            .then(data => { if (data) setHealth(data); })
            .catch(() => {});
    }, []);

    const userInitials = currentUser?.name
        ? currentUser.name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
        : 'MCC';

    const handleCreateClone = async () => {
        if (!newCloneName || !newCloneKey || !newCloneEmail) return;

        setProvisionStep(0);
        setProvisioningStatus(PROV_STEPS[0]);

        const stepTimer = (step: number) => setTimeout(() => {
            if (step < PROV_STEPS.length) {
                setProvisionStep(step);
                setProvisioningStatus(PROV_STEPS[step]);
            }
        }, step * 900);

        const timers = PROV_STEPS.map((_, i) => stepTimer(i));

        try {
            await ProvisioningEngine.provisionNewInstance({
                name: newCloneName,
                key: newCloneKey,
                ownerEmail: newCloneEmail,
                initialPrimaryColor: '#6366f1',
                tier: newCloneTier,
                copyBaseTemplates: true,
            });

            timers.forEach(clearTimeout);
            setProvisionStep(PROV_STEPS.length);
            setProvisioningStatus('Clone Actif · Déploiement terminé ✓');
            refreshFleet();
            setTimeout(() => {
                setShowCloneModal(false);
                setProvisioningStatus(null);
                setProvisionStep(0);
                setNewCloneName('');
                setNewCloneKey('');
                setNewCloneEmail('');
                setNewCloneTier('STANDARD');
            }, 2500);
        } catch {
            timers.forEach(clearTimeout);
            setProvisioningStatus('Critical Error in Provisioning.');
        }
    };

    return {
        instances, globalMetrics, isLoading, refreshFleet,
        health, userInitials,
        showCloneModal, setShowCloneModal,
        activeTab, setActiveTab,
        newCloneName, setNewCloneName,
        newCloneKey, setNewCloneKey,
        newCloneEmail, setNewCloneEmail,
        newCloneTier, setNewCloneTier,
        provisioningStatus, provisionStep,
        handleCreateClone,
    };
}
