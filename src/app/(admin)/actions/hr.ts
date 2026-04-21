"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { PageHeaderWithDocs } from "@/components/ui/PageHeaderWithDocs";
import { StaffService } from '@/domain/services/StaffService';
import { Shift, LeaveRequest } from '@/modules/hr/types';

/**
 * 🧑‍🍳 HR Actions - Restaurant OS
 */

export async function upsertShiftAction(tenantId: string, shiftData: Partial<Shift>) {
    logger.info(`[ServerAction] Upserting Shift (Tenant: ${tenantId})`);

    try {
        const batch = Nexus.adapter.batch();
        const timestamp = new Date();
        
        const shiftsPath = `tenants/${tenantId}/shifts`;
        const shiftId = shiftData.id || Nexus.adapter.generateId(shiftsPath);
        const shiftPath = `${shiftsPath}/${shiftId}`;

        const finalShift = {
            ...shiftData,
            id: shiftId,
            updatedAt: timestamp.toISOString(),
            createdAt: shiftData.createdAt || timestamp.toISOString()
        };

        batch.set(shiftPath, finalShift);

        // 🌉 AUTOMATED ACCOUNTING BRIDGE (Provision pour charges de personnel)
        if (finalShift.status === 'published') {
            const estimatedHourlyRate = 1800; // 18.00€ Charge incl.
            const startStr = `${finalShift.date.split('T')[0]}T${finalShift.startTime}`;
            const endStr = `${finalShift.date.split('T')[0]}T${finalShift.endTime}`;
            const durationMs = new Date(endStr).getTime() - new Date(startStr).getTime();
            const hours = durationMs / (1000 * 60 * 60);
            const totalCostCents = Math.round(hours * estimatedHourlyRate);

            if (totalCostCents > 0) {
                const journalEntriesPath = `tenants/${tenantId}/journalEntries`;
                const journalId = Nexus.adapter.generateId(journalEntriesPath);
                
                batch.set(`${journalEntriesPath}/${journalId}`, {
                    id: journalId,
                    pieceNumber: `PAY-${timestamp.getTime()}`,
                    date: timestamp.toISOString(),
                    description: `Provision Charge Personnel - Shift ${finalShift.id} (${finalShift.userId})`,
                    status: 'draft',
                    referenceId: finalShift.id,
                    referenceType: 'payroll',
                    isSystemGenerated: true,
                    isValidated: false,
                    lines: [
                        {
                            accountId: 'acc_641',
                            accountCode: '641',
                            accountName: 'Rémunérations du personnel',
                            description: `Estimation coût horaire (${hours.toFixed(2)}h @ 18€/h)`,
                            side: 'debit',
                            amountInCents: totalCostCents
                        },
                        {
                            accountId: 'acc_421',
                            accountCode: '421',
                            accountName: 'Personnel - Rémunérations dues',
                            description: `Provision pour paie à venir`,
                            side: 'credit',
                            amountInCents: totalCostCents
                        }
                    ],
                    metadata: {
                        userId: finalShift.userId,
                        hours,
                        hourlyRate: estimatedHourlyRate
                    }
                });
            }
        }

        await batch.commit();
        logger.info(`[ServerAction] Shift Persisted & Bridged: ${shiftId}`);
        return { success: true, id: shiftId };

    } catch (error) {
        logger.error(`[ServerAction] Shift Upsert Failed!`, error);
        throw new Error("Failed to persist shift and generate accounting bridge.");
    }
}

export async function publishShiftsAction(tenantId: string, shiftIds: string[]) {
    logger.info(`[ServerAction] Publishing ${shiftIds.length} shifts (Tenant: ${tenantId})`);
    
    try {
        const batch = Nexus.adapter.batch();
        const timestamp = new Date();
        
        for (const id of shiftIds) {
            const shiftPath = `tenants/${tenantId}/shifts/${id}`;
            
            batch.update(shiftPath, {
                status: 'published',
                updatedAt: timestamp.toISOString()
            });
            
            const journalEntriesPath = `tenants/${tenantId}/journalEntries`;
            const journalId = Nexus.adapter.generateId(journalEntriesPath);
            
            batch.set(`${journalEntriesPath}/${journalId}`, {
                id: journalId,
                pieceNumber: `BATCH-PUB-${timestamp.getTime()}`,
                date: timestamp.toISOString(),
                description: `Provision Batch HR - Shift ${id}`,
                status: 'draft',
                referenceId: id,
                referenceType: 'payroll',
                isSystemGenerated: true,
                isValidated: false,
                lines: [
                    {
                        accountId: 'acc_641',
                        accountCode: '641',
                        accountName: 'Rémunérations du personnel',
                        description: `Estimation coût batch`,
                        side: 'debit',
                        amountInCents: 0
                    },
                    {
                        accountId: 'acc_421',
                        accountCode: '421',
                        accountName: 'Personnel - Rémunérations dues',
                        description: `Attente calcul final`,
                        side: 'credit',
                        amountInCents: 0
                    }
                ]
            });
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        logger.error(`[ServerAction] Batch Publish Failed!`, error);
        throw new Error("Failed to publish shifts.");
    }
}

export async function deleteShiftAction(tenantId: string, shiftId: string) {
    logger.info(`[ServerAction] Deleting Shift (Tenant: ${tenantId}, ID: ${shiftId})`);
    try {
        await Nexus.adapter.delete(`tenants/${tenantId}/shifts/${shiftId}`);
        return { success: true };
    } catch (error) {
        logger.error(`[ServerAction] Shift Deletion Failed!`, error);
        throw new Error("Failed to delete shift.");
    }
}

/**
 * 🛫 Leave Management Actions
 */

export async function createLeaveRequestAction(tenantId: string, requestData: Partial<LeaveRequest>) {
    logger.info(`[ServerAction] Creating Leave Request (Tenant: ${tenantId})`);
    
    // 1. Validate Business Rules via StaffService
    const validation = StaffService.validateLeaveRequest(requestData);
    if (!validation.valid) {
        throw new Error(validation.error || "Invalid leave request.");
    }

    try {
        const timestamp = new Date();
        const leavePath = `tenants/${tenantId}/leaveRequests`;
        const requestId = Nexus.adapter.generateId(leavePath);
        
        const finalRequest = {
            ...requestData,
            id: requestId,
            status: 'pending_approval',
            createdAt: timestamp.toISOString(),
            updatedAt: timestamp.toISOString()
        };

        await Nexus.adapter.set(`${leavePath}/${requestId}`, finalRequest);
        return { success: true, id: requestId };
    } catch (error) {
        logger.error(`[ServerAction] Leave Request Creation Failed!`, error);
        throw new Error("Failed to create leave request.");
    }
}


export async function approveLeaveRequestAction(tenantId: string, requestId: string) {
    logger.info(`[ServerAction] Approving Leave Request (Tenant: ${tenantId}, ID: ${requestId})`);
    try {
        const timestamp = new Date();
        const requestPath = `tenants/${tenantId}/leaveRequests/${requestId}`;
        
        await Nexus.adapter.update(requestPath, {
            status: 'approved',
            updatedAt: timestamp.toISOString()
        });
        
        return { success: true };
    } catch (error) {
        logger.error(`[ServerAction] Leave Request Approval Failed!`, error);
        throw new Error("Failed to approve leave request.");
    }
}

export async function rejectLeaveRequestAction(tenantId: string, requestId: string, reason?: string) {
    logger.info(`[ServerAction] Rejecting Leave Request (Tenant: ${tenantId}, ID: ${requestId})`);
    try {
        const timestamp = new Date();
        const requestPath = `tenants/${tenantId}/leaveRequests/${requestId}`;
        
        await Nexus.adapter.update(requestPath, {
            status: 'rejected',
            managerComment: reason,
            updatedAt: timestamp.toISOString()
        });
        
        return { success: true };
    } catch (error) {
        logger.error(`[ServerAction] Leave Request Rejection Failed!`, error);
        throw new Error("Failed to reject leave request.");
    }
}
