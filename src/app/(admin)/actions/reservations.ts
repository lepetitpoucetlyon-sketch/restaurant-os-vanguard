"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

/**
 * 📅 Reservations Actions - Restaurant OS
 * Production-grade persistence for omnichannel bookings.
 */

import { ReservationService } from '@/domain/services/ReservationService';

/**
 * 📅 Reservations Actions - Restaurant OS
 */

export async function upsertReservationAction(tenantId: string, data: any) {
    if (!tenantId) throw new Error("Tenant ID is required for reservation actions.");
    
    // 1. Validate Business Rules
    const validation = ReservationService.validateReservation(data);
    if (!validation.valid) {
        throw new Error(validation.error || "Données de réservation invalides.");
    }

    try {
        const reservationsPath = `tenants/${tenantId}/reservations`;
        const id = data.id || Nexus.adapter.generateId(reservationsPath);
        const reservationPath = `${reservationsPath}/${id}`;
        
        // 2. Prepare Payload via Service
        const payload = ReservationService.prepareReservation(data, id);

        // --- 🛡️ GRADE IX: ATOMIC SUTURE (P5-V V4) ---
        const batch = Nexus.adapter.batch();
        
        // A. Set Reservation
        batch.set(reservationPath, payload);

        // B. Suture Spatiale: Update Table Status (if tableId is assigned)
        if (data.tableId) {
            batch.update(`tenants/${tenantId}/tables/${data.tableId}`, {
                status: 'reserved',
                updatedAt: new Date().toISOString()
            });
            logger.info(`[Suture] Table ${data.tableId} locked for reservation ${id}`);
        }

        await batch.commit();
        
        revalidatePath('/omnichannel-reservations');
        return { success: true, id };
    } catch (error) {
        logger.error(`[ServerAction] Reservation upsert failed`, error);
        throw error;
    }
}


export async function deleteReservationAction(tenantId: string, reservationId: string) {
    if (!tenantId || !reservationId) throw new Error("Missing credentials for deletion.");
    
    try {
        const reservationPath = `tenants/${tenantId}/reservations/${reservationId}`;
        const reservation = await Nexus.adapter.get(reservationPath) as any;
        const batch = Nexus.adapter.batch();
        batch.delete(reservationPath);
        if (reservation?.tableId) {
            batch.update(`tenants/${tenantId}/tables/${reservation.tableId}`, {
                status: 'available',
                updatedAt: new Date().toISOString()
            });
            logger.info(`[Suture] Table ${reservation.tableId} released after reservation deletion`);
        }
        await batch.commit();
        revalidatePath('/omnichannel-reservations');
        return { success: true };
    } catch (error) {
        logger.error(`[Reservations] Deletion failed`, error);
        throw error;
    }
}

// --- 📅 INDUSTRIAL LIFECYCLE (Grade IX) ---

export async function markNoShowAction(tenantId: string, reservationId: string) {
    if (!tenantId || !reservationId) throw new Error("[Reservations] Missing credentials for no-show.");
    try {
        const reservationPath = `tenants/${tenantId}/reservations/${reservationId}`;
        await Nexus.adapter.update(reservationPath, {
            status: 'noshow',
            noShowAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        logger.info(`[Reservations] Marked reservation ${reservationId} as NO-SHOW`);
        revalidatePath('/omnichannel-reservations');
        revalidatePath('/reservations');
        return { success: true };
    } catch (error) {
        logger.error(`[Reservations] No-show marking failed`, error);
        throw error;
    }
}

export async function cancelReservationAction(tenantId: string, reservationId: string, reason?: string) {
    if (!tenantId || !reservationId) throw new Error("[Reservations] Missing credentials for cancellation.");
    try {
        const reservationPath = `tenants/${tenantId}/reservations/${reservationId}`;
        await Nexus.adapter.update(reservationPath, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancellationReason: reason || 'Non spécifié',
            updatedAt: new Date().toISOString(),
        });
        logger.info(`[Reservations] Cancelled reservation ${reservationId} — Reason: ${reason || 'N/A'}`);
        revalidatePath('/omnichannel-reservations');
        revalidatePath('/reservations');
        return { success: true };
    } catch (error) {
        logger.error(`[Reservations] Cancellation failed`, error);
        throw error;
    }
}

export async function createReservationAction(tenantId: string, data: any) {
    return upsertReservationAction(tenantId, data);
}

export async function updateReservationStatusAction(tenantId: string, reservationId: string, status: string) {
    logger.info(`[Reservations] Updating status of ${reservationId} to ${status}`);
    try {
        const reservationPath = `tenants/${tenantId}/reservations/${reservationId}`;
        await Nexus.adapter.update(reservationPath, {
            status,
            updatedAt: new Date().toISOString(),
        });
        revalidatePath('/omnichannel-reservations');
        return { success: true };
    } catch (error) {
        logger.error(`[Reservations] Status update failed`, error);
        throw error;
    }
}
