"use client";

import { QualityEngine } from '@/domain/services/QualityEngine';
import { useCallback, useState, useMemo } from 'react';
import { QualityControl } from '@/domain/types/quality';

/**
 * 📝 useRegistre - Grade VI Atomic Bridge
 * Centralise les opérations de conformité HACCP et Registre technique.
 */
export function useRegistre() {
    const [isProcessing, setIsProcessing] = useState(false);

    const validateHACCP = useCallback(async (data: Partial<QualityControl>, tenantId: string) => {
        setIsProcessing(true);
        try {
            return await QualityEngine.validateReception(data as any, tenantId);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // 🛡️ UI COMPATIBILITY LAYER (Grade VI)
    // In a real scenario, these would be fetched from atoms. 
    // For now, we provide the structure needed by RegistrePage.
    const mockDoc = (title: string, status: string = 'conforme') => ({
        id: title.toLowerCase().replace(/ /g, '_'),
        title,
        status,
        description: `Registre de conformité pour ${title}.`,
        lastUpdated: new Date().toLocaleDateString('fr-FR'),
        nextReview: '15/06/2026'
    });

    return {
        // Actions
        validateHACCP,
        isProcessing,

        // Data (Bridges to keep UI alive)
        duerp: mockDoc('Document Unique'),
        cerfa: mockDoc('Cerfa 13984', 'attention'),
        pmrDoc: mockDoc('Accessibilité PMR'),
        incendieDoc: mockDoc('Sécurité Incendie'),
        hottesDoc: mockDoc('Nettoyage Hottes'),
        certHalal: mockDoc('Certification Halal'),
        agrementBoucher: mockDoc('Agrément Boucher'),
        prestataires: [
            { id: '1', name: 'SafeClean', status: 'valide' },
            { id: '2', name: 'FireGuard', status: 'valide' }
        ],
        getOverallStatus: () => ({ conforme: 5, attention: 1, non_conforme: 0 }),
        registreEntries: [],
    };
}
