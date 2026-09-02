"use client";

import { useCallback, useState, useEffect } from 'react';
import type { ReceptionData } from '@nexus/contracts';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { useTenant } from '@/shared/hooks/useTenant';
import type { 
    ComplianceDocument,
    ExtincteurDocument,
    ExerciceDocument,
    InterventionDocument,
    PrestataireDocument,
    PMRAmenagement,
} from '@/shared/nexus/contracts/context/registre.contracts';
import type { RegistreEntry, InterventionLog } from '@nexus/contracts/registre.types';

export type {
    ComplianceDocument,
    ExtincteurDocument,
    ExerciceDocument,
    InterventionDocument,
    PrestataireDocument,
    PMRAmenagement,
};

export type RegisterDoc = ComplianceDocument;
export type Prestataire = PrestataireDocument;

const DEFAULT_DOC = (id: string, name: string): ComplianceDocument => ({
    id,
    name,
    title: name,
    description: `Registre de conformité pour ${name}.`,
    url: '',
    status: 'attention' as ComplianceDocument['status'],
    validUntil: null,
    lastUpdated: new Date().toISOString(),
    nextReview: new Date(Date.now() + 365 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
});

export function useRegistre() {
    const [isProcessing, setIsProcessing] = useState(false);
    const { activeTenantId } = useTenant();
    const [documents, setDocuments] = useState<Record<string, ComplianceDocument>>({});
    const [prestataires, setPrestataires] = useState<PrestataireDocument[]>([]);
    const [interventions, setInterventions] = useState<InterventionDocument[]>([]);
    const [extincteurs, setExtincteurs] = useState<ExtincteurDocument[]>([]);
    const [exercices, setExercices] = useState<ExerciceDocument[]>([]);
    const [pmrAmenagements, setPmrAmenagements] = useState<PMRAmenagement[]>([]);
    const [registreEntries, setRegistreEntries] = useState<RegistreEntry[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!activeTenantId) return;
        let cancelled = false;

        async function load() {
            try {
                const [docs, prests, ints, entries, exts, exercs, pmrs] = await Promise.all([
                    Nexus.adapter.query<ComplianceDocument>(`tenants/${activeTenantId}/documents`, {}),
                    Nexus.adapter.query<PrestataireDocument>(`tenants/${activeTenantId}/prestataires`, {}),
                    Nexus.adapter.query<InterventionDocument>(`tenants/${activeTenantId}/interventions`, {}),
                    Nexus.adapter.query<RegistreEntry>(`tenants/${activeTenantId}/registreEntries`, {}),
                    Nexus.adapter.query<ExtincteurDocument>(`tenants/${activeTenantId}/extincteurs`, {}),
                    Nexus.adapter.query<ExerciceDocument>(`tenants/${activeTenantId}/exercices`, {}),
                    Nexus.adapter.query<PMRAmenagement>(`tenants/${activeTenantId}/pmrAmenagements`, {}),
                ]);
                if (cancelled) return;

                const docMap: Record<string, ComplianceDocument> = {};
                for (const doc of docs) {
                    docMap[doc.id] = doc;
                }
                setDocuments(docMap);
                setPrestataires(prests);
                setInterventions(ints);
                setRegistreEntries(entries);
                setExtincteurs(exts);
                setExercices(exercs);
                setPmrAmenagements(pmrs);
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
            const checkId = `HACCP-${Date.now()}`;
            await NexusEventBus.emitDurable('haccp.check.saved', {
                v: 1,
                tenantId,
                checkId,
                operatorId: data.deliveryId || 'system',
                timestamp: Date.now(),
            });
            return { id: checkId, currentStatus: data.hygieneStatus ?? 'conforme' };
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const getDoc = (key: string, fallbackName: string): ComplianceDocument =>
        documents[key] || DEFAULT_DOC(key, fallbackName);

    const getOverallStatus = () => {
        const allDocs = Object.values(documents);
        return {
            conforme: allDocs.filter(d => d.status === 'valid').length,
            attention: allDocs.filter(d => d.status === 'pending' || (d.status as string) === 'attention').length,
            non_conforme: allDocs.filter(d => d.status === 'expired' || d.status === 'missing').length,
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
        extincteurs,
        exercices,
        pmrAmenagements,
        getOverallStatus,
        registreEntries,
        interventions,
    };
}
