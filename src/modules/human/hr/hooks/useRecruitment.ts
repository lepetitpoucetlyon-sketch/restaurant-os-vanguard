'use client';

import { useState, useEffect, useCallback } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { Candidate, CandidateStatus, RecruitmentLog, GDPRConsent } from '@nexus/contracts';
import { useAuth, useTenant } from '@/hooks';
const stubAction = async (_tenantId: string, _candidate: Candidate): Promise<{ success: boolean; id: string }> => ({ success: true, id: "STUB_ID" });
const hiredCandidateAction = stubAction;

export function useRecruitment() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [logs, setLogs] = useState<RecruitmentLog[]>([]);
    const { currentUser } = useAuth();
    const { activeTenantId } = useTenant();
    
    // Subscribe to Candidates
    useEffect(() => {
        if (!activeTenantId) return;
        
        const path = `tenants/${activeTenantId}/candidates`;
        const unsubscribe = Nexus.adapter.onSnapshot(path, (data: Candidate[]) => {
            if (Array.isArray(data)) {
                setCandidates(data);
            }
        }, {
            orderBy: { field: 'updatedAt', direction: 'desc' }
        });
        return () => unsubscribe();
    }, [activeTenantId]);

    // Subscribe to Logs
    useEffect(() => {
        if (!activeTenantId) return;

        const path = `tenants/${activeTenantId}/recruitment_logs`;
        const unsubscribe = Nexus.adapter.onSnapshot(path, (data: RecruitmentLog[]) => {
            if (Array.isArray(data)) {
                setLogs(data);
            }
        }, {
            orderBy: { field: 'timestamp', direction: 'desc' }
        });
        return () => unsubscribe();
    }, [activeTenantId]);

    const logAction = useCallback(async (candidateId: string, action: string, notes?: string) => {
        if (!currentUser || !activeTenantId) return;
        
        const logsPath = `tenants/${activeTenantId}/recruitment_logs`;
        const logId = Nexus.adapter.generateId(logsPath);
        const now = new Date().toISOString();
        
        await Nexus.adapter.set(`${logsPath}/${logId}`, {
            id: logId,
            candidateId,
            action,
            performedBy: currentUser.name,
            timestamp: now,
            notes: notes || "",
            createdAt: now,
            updatedAt: now
        } as RecruitmentLog);
    }, [currentUser, activeTenantId]);

    const addCandidate = useCallback(async (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!activeTenantId) return;

        const now = new Date().toISOString();
        const candidatesPath = `tenants/${activeTenantId}/candidates`;
        const candidateId = Nexus.adapter.generateId(candidatesPath);
        
        await Nexus.adapter.set(`${candidatesPath}/${candidateId}`, {
            ...candidate,
            id: candidateId,
            createdAt: now,
            updatedAt: now,
        } as Candidate);

        const gdpr = candidate.gdpr as unknown as GDPRConsent;
        await logAction(candidateId, "Candidat ajouté au système", gdpr?.consented ? "RGPD: Consentement validé" : "RGPD: ATTENTION - Consentement manquant");
        return candidateId;
    }, [activeTenantId, logAction]);

    const updateCandidateStatus = useCallback(async (id: string, status: CandidateStatus) => {
        if (!activeTenantId) return;

        // GRADE IX: SURGICAL SUTURE FOR HIRED STATUS
        if (status === 'hired') {
            const candidate = candidates.find(c => c.id === id);
            if (candidate) {
                await hiredCandidateAction(activeTenantId, candidate);
                return;
            }
        }

        const candidatePath = `tenants/${activeTenantId}/candidates/${id}`;
        await Nexus.adapter.update(candidatePath, { 
            status, 
            updatedAt: new Date().toISOString(),
            lastContactDate: new Date().toISOString()
        });
        await logAction(id, `Statut mis à jour: ${status}`);
    }, [activeTenantId, candidates, logAction]);

    const deleteOldCandidates = useCallback(async () => {
        if (!activeTenantId) return;

        // GDPR: Purge logic for 6+ months old
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const candidatesPath = `tenants/${activeTenantId}/candidates`;
        const oldCandidates = await Nexus.adapter.query(candidatesPath, {
            where: [{ field: 'updatedAt', operator: '<', value: sixMonthsAgo.toISOString() }]
        }) as Candidate[];

        const batch = Nexus.adapter.batch();
        
        for (const candidate of oldCandidates) {
            batch.delete(`${candidatesPath}/${candidate.id}`);
            
            // Also need to find and delete related logs
            const logsPath = `tenants/${activeTenantId}/recruitment_logs`;
            const relatedLogs = await Nexus.adapter.query(logsPath, {
                where: [{ field: 'candidateId', operator: '==', value: candidate.id }]
            }) as RecruitmentLog[];
            relatedLogs.forEach((l: RecruitmentLog) => batch.delete(`${logsPath}/${l.id}`));
        }

        await batch.commit();
    }, [activeTenantId]);

    return {
        candidates,
        logs,
        addCandidate,
        updateCandidateStatus,
        deleteOldCandidates
    };
}

