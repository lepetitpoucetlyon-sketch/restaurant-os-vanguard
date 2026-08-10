"use server";

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';
import { SovereignNode } from '@/shared/nexus-contract';

import { createSafeAction } from "@/shared/nexus/actions/actionWrapper";
import { z } from "zod";

export const updateFloorNodeAction = createSafeAction(
    z.tuple([z.string(), z.custom<unknown>(() => true)]),
    { page: "floor_plan", action: "move_table" },
    async (tenantId, id: string, data: Partial<SovereignNode>) => {
        try {
            await NexusEventBus.emitDurable('floor.node.updated', { tenantId, id, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const createFloorNodeAction = createSafeAction(
    z.tuple([z.custom<unknown>(() => true)]),
    { page: "floor_plan", action: "add_table" },
    async (tenantId, data: Partial<SovereignNode>) => {
        try {
            await NexusEventBus.emitDurable('floor.node.created', { tenantId, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const deleteFloorNodeAction = createSafeAction(
    z.tuple([z.string()]),
    { page: "floor_plan", action: "delete_table" },
    async (tenantId, id: string) => {
        try {
            await NexusEventBus.emitDurable('floor.node.deleted', { tenantId, id });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const updateFloorZoneAction = createSafeAction(
    z.tuple([z.string(), z.custom<unknown>(() => true)]),
    { page: "floor_plan", action: "modify_seats" },
    async (tenantId, id: string, data: Partial<SovereignNode>) => {
        try {
            await NexusEventBus.emitDurable('floor.zone.updated', { tenantId, id, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const createFloorZoneAction = createSafeAction(
    z.tuple([z.custom<unknown>(() => true)]),
    { page: "floor_plan", action: "create_zone" },
    async (tenantId, data: Partial<SovereignNode>) => {
        try {
            await NexusEventBus.emitDurable('floor.zone.created', { tenantId, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const deleteFloorZoneAction = createSafeAction(
    z.tuple([z.string()]),
    { page: "floor_plan", action: "delete_zone" },
    async (tenantId, id: string) => {
        try {
            await NexusEventBus.emitDurable('floor.zone.deleted', { tenantId, id });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);
