"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { Area } from '@/types/tables.types';

/**
 * 🌉 Operations actions (OMS) - Restaurant OS
 * Grade IX: Surgical Suture Operations -> Accounting
 */

export async function arrivalAreaAction(tenantId: string, area: any, customerData: any) {
    logger.info(`[OMSAction] Recording Arrival in Area ${area.number} (Tenant: ${tenantId})`);

    try {
        const batch = Nexus.adapter.batch();
        const timestamp = new Date().toISOString();
        const now = new Date();
        
        // 1. Update Area Status
        const areaPath = `tenants/${tenantId}/areas/${area.id}`;
        batch.update(areaPath, {
            status: 'busy',
            updatedAt: timestamp
        });

        // 2. Create Booking Record
        const bookingsPath = `tenants/${tenantId}/bookings`;
        const bookingId = Nexus.adapter.generateId(bookingsPath);
        
        const newLog = {
            id: bookingId,
            areaId: area.id,
            areaNumber: area.number,
            customerId: customerData.id || "walk-in",
            customerName: customerData.name || "Client de passage",
            arrival: timestamp,
            status: 'active',
            totalAmountInCents: area.price * 100, 
            createdAt: timestamp,
            updatedAt: timestamp
        };
        batch.set(`${bookingsPath}/${bookingId}`, newLog);

        // 3. 🌉 Accounting Suture : Provision Facturation
        const journalEntriesPath = `tenants/${tenantId}/journalEntries`;
        const journalId = Nexus.adapter.generateId(journalEntriesPath);
        
        const totalAmount = area.price * 100;
        const taxAmount = Math.round(totalAmount * 0.10); // 10% VAT Default

        batch.set(`${journalEntriesPath}/${journalId}`, {
            id: journalId,
            pieceNumber: `OMS-AR-${now.getTime()}`,
            date: timestamp,
            description: `Provision Revenu - Espace ${area.number}`,
            status: 'draft',
            referenceId: bookingId,
            referenceType: 'oms',
            isSystemGenerated: true,
            isValidated: false,
            lines: [
                {
                    accountId: 'acc_411',
                    accountCode: '411',
                    accountName: 'Clients',
                    description: `Créance Client - Espace ${area.number}`,
                    side: 'debit',
                    amountInCents: totalAmount
                },
                {
                    accountId: 'acc_706',
                    accountCode: '706',
                    accountName: 'Prestations de services',
                    description: `Revenu Service HT`,
                    side: 'credit',
                    amountInCents: totalAmount - taxAmount
                },
                {
                    accountId: 'acc_4457',
                    accountCode: '4457',
                    accountName: 'TVA Collectée',
                    description: `TVA 10%`,
                    side: 'credit',
                    amountInCents: taxAmount
                }
            ]
        });

        // 4. Create Draft Invoice
        const invoicesPath = `tenants/${tenantId}/invoices`;
        const invoiceId = Nexus.adapter.generateId(invoicesPath);
        batch.set(`${invoicesPath}/${invoiceId}`, {
            id: invoiceId,
            bookingId: bookingId,
            areaId: area.id,
            customerName: customerData.name || "Client de passage",
            amountInCents: totalAmount,
            status: 'draft',
            type: 'booking',
            date: timestamp,
            dueDate: timestamp,
            metadata: {
                areaNumber: area.number,
                rate: area.price
            }
        });

        await batch.commit();
        logger.info(`[OMSAction] Suture Success! Area ${area.number} linked to Ledger ${journalId}`);
        
        return { success: true, bookingId };

    } catch (error) {
        logger.error(`[OMSAction] Arrival Suture Failed!`, error);
        throw new Error("Failed to finalize arrival and generate accounting bridge.");
    }
}
