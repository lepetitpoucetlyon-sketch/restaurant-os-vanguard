"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { User } from "@nexus/contracts";

import { Nexus } from "@/lib/nexus/NexusAdapter";
import type { StaffDocument } from "../staffComputations";
import { DigitalEmployeeVault } from "../../../services/DigitalEmployeeVault";

export interface UseStaffDocsInput {
    selectedSkillUser: User | null;
    tenantId: string | null | undefined;
    currentUserId: string | undefined;
}

export interface UseStaffDocsResult {
    staffDocs: StaffDocument[];
    docForm: { name: string; url: string } | null;
    setDocForm: (form: { name: string; url: string } | null) => void;
    handleAddDoc: () => Promise<void>;
    handleDeleteDoc: (doc: StaffDocument) => Promise<void>;
}

function buildStaffDoc(
    userId: string | null,
    form: { name: string; url: string } | null,
): { doc: StaffDocument } | { error: string } | null {
    if (!userId || !form) return null;
    if (!form.name.trim() || !form.url.trim()) return { error: "Nom et URL requis." };
    return {
        doc: {
            id: `${userId}_${Date.now()}`,
            userId,
            name: form.name.trim(),
            url: form.url.trim(),
            uploadedAt: new Date().toISOString(),
        },
    };
}

async function sealAndPersistDoc(
    doc: StaffDocument,
    tenantId: string | null | undefined,
    currentUserId: string | undefined,
): Promise<void> {
    if (tenantId) {
        await DigitalEmployeeVault.sealDocument(
            tenantId,
            {
                id: doc.id,
                tenantId,
                userId: doc.userId,
                type: 'contract',
                name: doc.name,
                url: doc.url,
                uploadedAt: doc.uploadedAt,
                status: 'valid',
                vaultArchiveEligible: true,
            },
            currentUserId ?? 'manager',
        );
    }
    await Nexus.adapter.set(`staffDocuments/${doc.id}`, doc);
}

/**
 * Sous-hook RH pour la gestion des documents salarié :
 * fetch réactif sur `selectedSkillUser`, scellement DigitalEmployeeVault
 * (traçabilité L3243-2), persistance Nexus, suppression.
 */
export function useStaffDocs({
    selectedSkillUser,
    tenantId,
    currentUserId,
}: UseStaffDocsInput): UseStaffDocsResult {
    const [staffDocs, setStaffDocs] = useState<StaffDocument[]>([]);
    const [docForm, setDocForm] = useState<{ name: string; url: string } | null>(null);

    useEffect(() => {
        if (!selectedSkillUser) {
            setStaffDocs([]);
            return;
        }
        Nexus.adapter
            .query<StaffDocument>('staffDocuments', {
                where: [{ field: 'userId', operator: '==', value: selectedSkillUser.id }],
                orderBy: { field: 'uploadedAt', direction: 'desc' },
            })
            .then(setStaffDocs)
            .catch(() => setStaffDocs([]));
    }, [selectedSkillUser]);

    const handleAddDoc = async () => {
        const result = buildStaffDoc(selectedSkillUser?.id ?? null, docForm);
        if (!result) return;
        if ('error' in result) {
            toast.error(result.error);
            return;
        }
        const { doc } = result;
        try {
            await sealAndPersistDoc(doc, tenantId, currentUserId);
            setStaffDocs((prev) => [doc, ...prev]);
            setDocForm(null);
            toast.success("Document scellé et enregistré dans le coffre-fort RH.");
        } catch {
            toast.error("Erreur lors de l'enregistrement.");
        }
    };

    const handleDeleteDoc = async (doc: StaffDocument) => {
        try {
            await Nexus.adapter.delete(`staffDocuments/${doc.id}`);
            setStaffDocs((prev) => prev.filter((d) => d.id !== doc.id));
            toast.success("Document supprimé.");
        } catch {
            toast.error("Erreur lors de la suppression.");
        }
    };

    return { staffDocs, docForm, setDocForm, handleAddDoc, handleDeleteDoc };
}
