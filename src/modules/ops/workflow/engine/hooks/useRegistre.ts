"use client";

// eslint-disable-next-line vanguard/no-inter-module-imports
import { QualityEngine } from '@modules/compliance/services/QualityEngine';
import { useCallback, useState, useEffect } from 'react';
import { ReceptionData } from '@/modules/compliance';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/kernel/hooks';
import type { RegisterDocStatus, RegistreEntry, InterventionLog } from '@nexus/contracts/registre.types';

interface RegisterDoc {
    id: string;
    title: string;
    status: RegisterDocStatus;
    description: string;
    lastUpdated: string;
    nextReview: string;
    updatedAt: string;
}

interface Prestataire {
    id: string;
    name: string;
    type: string;
    status: 'valide' | 'expire' | 'suspendu';
    phone: string;
    certification: string;
    certificationExpiry: string;
    frequency: string;
}

const DEFAULT_DOC: RegisterDoc = {
    id: '',
    title: '',
    status: 'attention',
    description: '',
    lastUpdated: '',
    nextReview: '',
    updatedAt: '',
};

export function useRegistre() {
    const [isProcessing, setIsProcessing] = useState(false);
    const { activeTenantId } = useTenant();
    const [documents, setDocuments] = useState<Record<string, RegisterDoc>>({});
    const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
    const [interventions, setInterventions] = useState<InterventionLog[]>([]);
    const [registreEntries, setRegistreEntries] = useState<RegistreEntry[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!activeTenantId) return;
        let cancelled = false;

        async function load() {
            try {
                const [docs, prests, ints, entries] = await Promise.all([
                    Nexus.adapter.query<RegisterDoc>(`tenants/${activeTenantId}/documents`, {}),
                    Nexus.adapter.query<Prestataire>(`tenants/${activeTenantId}/prestataires`, {}),
                    Nexus.adapter.query<InterventionLog>(`tenants/${activeTenantId}/interventions`, {}),
                    Nexus.adapter.query<RegistreEntry>(`tenants/${activeTenantId}/registreEntries`, {}),
                ]);
                if (cancelled) return;

                const docMap: Record<string, RegisterDoc> = {};
                for (const doc of docs) {
                    docMap[doc.id] = doc;
                }
                setDocuments(docMap);
                setPrestataires(prests);
                setInterventions(ints);
                setRegistreEntries(entries);
            } catch (err) {
                console.error('[useRegistre] Failed to load data', err);
            } finally {
                if (!cancelled) setLoaded(true);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [activeTenantId]);

    const validateHACCP = useCallback(async (data: ReceptionData, tenantId: string) => {
        setIsProcessing(true);
        try {
            return await QualityEngine.validateReception(data, tenantId);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const getDoc = (key: string, fallbackTitle: string): RegisterDoc =>
        documents[key] || { ...DEFAULT_DOC, id: key, title: fallbackTitle, status: 'attention' as RegisterDocStatus, description: `Registre de conformité pour ${fallbackTitle}.` };

    const getOverallStatus = () => {
        const allDocs = Object.values(documents);
        return {
            conforme: allDocs.filter(d => d.status === 'certified').length,
            attention: allDocs.filter(d => d.status === 'attention').length,
            non_conforme: allDocs.filter(d => d.status === 'expired').length,
        };
    };

    return {
        validateHACCP,
        isProcessing,
        loaded,

        duerp: getDoc('duerp', 'Document Unique'),
        cerfa: getDoc('cerfa', 'Cerfa 13984'),
        pmrDoc: getDoc('pmr', 'Accessibilité PMR'),
        incendieDoc: getDoc('incendie', 'Sécurité Incendie'),
        hottesDoc: getDoc('hottes', 'Nettoyage Hottes'),
        certHalal: getDoc('halal', 'Certification Halal'),
        agrementBoucher: getDoc('boucher', 'Agrément Boucher'),
        prestataires,
        getOverallStatus,
        registreEntries,
        interventions,
    };
}
