'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useNexusFleet } from '@/shared/providers/fleet';
import type { PlatformVariant } from '@/modules/system';
import { useAuth } from '@/shared/providers/NexusCoreProvider';
import { authedFetch } from '@/lib/client/authedFetch';
import type { MCCHealthStatus } from '@/app/api/admin/mcc/health/route';

export const PROV_STEPS = [
    'Validation slug & collisions…',
    'Provisionnement Registry & DNA…',
    'Création compte propriétaire…',
    'Stripe & RAG Workspace…',
] as const;

export function useMccPage() {
    const { instances, globalMetrics, isLoading, refreshFleet } = useNexusFleet();
    const { currentUser } = useAuth();

    const searchParams = useSearchParams();
    const router       = useRouter();
    const pathname     = usePathname();

    const VALID_TABS = [
        'fleet', 'forgestudio', 'scrapecharter', 'blindspot', 'qualification',
        'derivers', 'sectorstudy', 'compliance', 'intelligence', 'treasury',
        'patchcenter', 'plugins', 'eventbus', 'lifecycle', 'tutorial', 'systemtenants'
    ] as const;
    type TabId = typeof VALID_TABS[number];
    const rawTab    = searchParams.get('tab') ?? '';
    const initialTab: TabId = (VALID_TABS as readonly string[]).includes(rawTab) ? rawTab as TabId : 'fleet';

    const [health, setHealth] = useState<MCCHealthStatus | null>(null);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [activeTab, setActiveTabState] = useState<TabId>(initialTab);

    const setActiveTab = useCallback((tab: TabId) => {
        setActiveTabState(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, searchParams]);
    const [newCloneName, setNewCloneName] = useState('');
    const [newCloneKey, setNewCloneKey] = useState('');
    const [newCloneEmail, setNewCloneEmail] = useState('');
    const [newCloneTier, setNewCloneTier] = useState<'STANDARD' | 'PREMIUM' | 'ENTERPRISE'>('STANDARD');
    const [newCloneVariant, setNewCloneVariant] = useState<PlatformVariant>('restaurant');
    const [newTrialDays, setNewTrialDays] = useState<number>(14);
    // Charte graphique du nouveau tenant
    const [newCloneBrandingMode, setNewCloneBrandingMode] = useState<'default' | 'custom'>('default');
    const [newCloneAccentColor, setNewCloneAccentColor] = useState<string>('#C5A059');
    const [newCloneLogoUrl, setNewCloneLogoUrl] = useState<string>('');
    const [newCloneSplashEnabled, setNewCloneSplashEnabled] = useState<boolean>(false);
    const [newCloneDisplayDepth, setNewCloneDisplayDepth] = useState<'essential' | 'manager' | 'enterprise'>('manager');
    const [provisioningStatus, setProvisioningStatus] = useState<string | null>(null);
    const [provisionStep, setProvisionStep] = useState(0);

    useEffect(() => {
        authedFetch('/api/admin/mcc/health')
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
            const res = await authedFetch('/api/admin/fleet/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCloneName,
                    key: newCloneKey,
                    ownerEmail: newCloneEmail,
                    tier: newCloneTier,
                    variant: newCloneVariant,
                    trialDays: newTrialDays > 0 ? newTrialDays : undefined,
                    displayDepth: newCloneDisplayDepth,
                    branding: {
                        mode: newCloneBrandingMode,
                        accentColor: newCloneBrandingMode === 'custom' ? newCloneAccentColor : undefined,
                        logoUrl: newCloneBrandingMode === 'custom' && newCloneLogoUrl ? newCloneLogoUrl : null,
                        splashEnabled: newCloneBrandingMode === 'custom' ? newCloneSplashEnabled : false,
                    },
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
            }

            timers.forEach(clearTimeout);
            setProvisionStep(PROV_STEPS.length);
            setProvisioningStatus('Établissement Actif · Déploiement terminé ✓');
            refreshFleet();
            setTimeout(() => {
                setShowCloneModal(false);
                setProvisioningStatus(null);
                setProvisionStep(0);
                setNewCloneName('');
                setNewCloneKey('');
                setNewCloneEmail('');
                setNewCloneTier('STANDARD');
                setNewTrialDays(14);
                setNewCloneBrandingMode('default');
                setNewCloneAccentColor('#C5A059');
                setNewCloneLogoUrl('');
                setNewCloneSplashEnabled(false);
                setNewCloneDisplayDepth('manager');
            }, 2500);
        } catch (err) {
            timers.forEach(clearTimeout);
            const message = err instanceof Error ? err.message : 'Erreur interne';
            setProvisioningStatus(`Erreur: ${message}`);
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
        newCloneVariant, setNewCloneVariant,
        newTrialDays, setNewTrialDays,
        newCloneBrandingMode, setNewCloneBrandingMode,
        newCloneAccentColor, setNewCloneAccentColor,
        newCloneLogoUrl, setNewCloneLogoUrl,
        newCloneSplashEnabled, setNewCloneSplashEnabled,
        newCloneDisplayDepth, setNewCloneDisplayDepth,
        provisioningStatus, provisionStep,
        handleCreateClone,
    };
}
