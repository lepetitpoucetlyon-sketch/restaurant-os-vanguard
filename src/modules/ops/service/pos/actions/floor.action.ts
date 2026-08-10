"use server";

import { requireSession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';
import { SovereignNode } from '@/shared/nexus-contract';

export async function updateFloorNodeAction(tenantId: string, id: string, data: Partial<SovereignNode>) {
    try {
        await requireSession(tenantId);
        await NexusEventBus.emitDurable('floor.node.updated', { tenantId, id, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function createFloorNodeAction(tenantId: string, data: Partial<SovereignNode>) {
    try {
        await requireSession(tenantId);
        await NexusEventBus.emitDurable('floor.node.created', { tenantId, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function deleteFloorNodeAction(tenantId: string, id: string) {
    try {
        await requireSession(tenantId);
        await NexusEventBus.emitDurable('floor.node.deleted', { tenantId, id });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function updateFloorZoneAction(tenantId: string, id: string, data: Partial<SovereignNode>) {
    try {
        await requireSession(tenantId);
        await NexusEventBus.emitDurable('floor.zone.updated', { tenantId, id, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function createFloorZoneAction(tenantId: string, data: Partial<SovereignNode>) {
    try {
        await requireSession(tenantId);
        await NexusEventBus.emitDurable('floor.zone.created', { tenantId, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function deleteFloorZoneAction(tenantId: string, id: string) {
    try {
        await requireSession(tenantId);
        await NexusEventBus.emitDurable('floor.zone.deleted', { tenantId, id });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}
