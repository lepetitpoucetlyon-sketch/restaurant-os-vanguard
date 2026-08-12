"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toError } from '@/lib/toError';
import { SovereignNode } from '@/shared/nexus-contract';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const FloorNodePayloadSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    shape: z.string().optional(),
    seats: z.number().int().min(0).optional(),
    zoneId: z.string().optional(),
    status: z.string().optional(),
}).passthrough();

const FloorZonePayloadSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    color: z.string().optional(),
    order: z.number().optional(),
}).passthrough();

export type FloorNodePayload = z.infer<typeof FloorNodePayloadSchema>;
export type FloorZonePayload = z.infer<typeof FloorZonePayloadSchema>;

export const updateFloorNodeAction = createSafeAction(
    z.tuple([z.string().min(1, 'id requis'), FloorNodePayloadSchema]),
    { page: "floor_plan", action: "move_table" },
    async (tenantId, id: string, data: FloorNodePayload) => {
        try {
            await NexusEventBus.emitDurable('floor.node.updated', { tenantId, id, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const createFloorNodeAction = createSafeAction(
    z.tuple([FloorNodePayloadSchema]),
    { page: "floor_plan", action: "add_table" },
    async (tenantId, data: FloorNodePayload) => {
        try {
            await NexusEventBus.emitDurable('floor.node.created', { tenantId, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const deleteFloorNodeAction = createSafeAction(
    z.tuple([z.string().min(1, 'id requis')]),
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
    z.tuple([z.string().min(1, 'id requis'), FloorZonePayloadSchema]),
    { page: "floor_plan", action: "modify_seats" },
    async (tenantId, id: string, data: FloorZonePayload) => {
        try {
            await NexusEventBus.emitDurable('floor.zone.updated', { tenantId, id, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const createFloorZoneAction = createSafeAction(
    z.tuple([FloorZonePayloadSchema]),
    { page: "floor_plan", action: "create_zone" },
    async (tenantId, data: FloorZonePayload) => {
        try {
            await NexusEventBus.emitDurable('floor.zone.created', { tenantId, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const deleteFloorZoneAction = createSafeAction(
    z.tuple([z.string().min(1, 'id requis')]),
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
