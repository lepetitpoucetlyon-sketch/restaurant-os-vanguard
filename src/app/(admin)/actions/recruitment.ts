"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { Candidate } from '@/types/recruitment';
import { EmployeeSettings } from '@/types/settings/hr';

/**
 * 🧑‍💼 Recruitment Actions - Restaurant OS
 * Grade IX: Surgical Suture Candidate -> Staff
 */

export async function hiredCandidateAction(tenantId: string, candidate: Candidate) {
    logger.info(`[RecruitmentAction] Hiring Candidate: ${candidate.id} (Tenant: ${tenantId})`);

    try {
        const batch = Nexus.adapter.batch();
        const timestamp = new Date().toISOString();
        
        // 1. Update Candidate Status
        const candidatePath = `tenants/${tenantId}/candidates/${candidate.id}`;
        batch.update(candidatePath, {
            status: 'hired',
            updatedAt: timestamp,
            lastContactDate: timestamp
        });

        // 2. Create Staff Profile
        const staffPath = `tenants/${tenantId}/staff`;
        const staffId = Nexus.adapter.generateId(staffPath);
        
        const newStaff: EmployeeSettings = {
            id: staffId,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            phone: candidate.phone,
            contractType: 'cdi', // Default
            hireDate: timestamp,
            department: 'admin', // Default
            positionId: 'pos_default', 
            weeklyHours: 35,
            hasHealthInsurance: true,
            hasMealVouchers: true,
            pinCode: '0000',
            systemRole: 'staff',
            isActive: true,
            certifications: candidate.appliedRole ? [candidate.appliedRole] : []
        };

        batch.set(`${staffPath}/${staffId}`, newStaff);

        // 3. Log the surgical event
        const logsPath = `tenants/${tenantId}/recruitment_logs`;
        const logId = Nexus.adapter.generateId(logsPath);
        batch.set(`${logsPath}/${logId}`, {
            id: logId,
            candidateId: candidate.id,
            action: "EMBAUCHE FINALISÉE - Transfert vers Staff",
            performedBy: "SYSTEM",
            timestamp: timestamp,
            notes: `Auto-généré par Grade IX Suture. StaffID: ${staffId}`
        });

        await batch.commit();
        logger.info(`[RecruitmentAction] Suture Success! Candidate ${candidate.id} is now Staff ${staffId}`);
        
        return { success: true, staffId };

    } catch (error) {
        logger.error(`[RecruitmentAction] Suture Failed!`, error);
        throw new Error("Failed to transition candidate to staff.");
    }
}
