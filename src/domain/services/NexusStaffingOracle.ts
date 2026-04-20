// @ts-nocheck
import { StaffingProposal, SharedKernel, DEFAULT_STAFF_RATIO } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SimulationService } from './SimulationService';

/**
 * 🧑‍💼 NexusStaffingOracle - Restaurant OS
 * The Predictive HR Advisor of the Empire.
 * Grade X : Autonomous Planning Guard.
 */
export class NexusStaffingOracle {
    /**
     * Compares predicted demand with scheduled staff to identify gaps.
     */
    static async analyzeStaffingGaps(date: string): Promise<StaffingProposal | null> {
        logger.info(`[StaffingOracle] Analyzing future reality for ${date}...`);

        // 1. Fetch Dynamic Configuration
        let ratio = DEFAULT_STAFF_RATIO;
        try {
            const settings = await Nexus.adapter.get(Nexus.getTenantPath('settings/global')) as any;
            if (settings?.hr?.planning?.staffToCoversRatio) {
                ratio = settings.hr.planning.staffToCoversRatio;
                logger.info(`[StaffingOracle] Using Custom Ratio: 1 brigadier / ${ratio} covers`);
            }
        } catch (e) {
            logger.warn(`[StaffingOracle] Failed to fetch settings, falling back to Grade X default (${ratio})`);
        }

        // 2. Get Predicted Velocity from Oracle
        const prediction = await SimulationService.simulateDay(new Date(date), 'EMPIRE', 'PIZZERIA_RUSH', {
            ingredients: [],
            stockItems: []
        });

        const predictedOrders = prediction.orders.length;
        const neededStaff = Math.ceil(predictedOrders / ratio);

        // 3. Fetch Scheduled Staff (Mocked for current Act)
        const currentScheduledStaff = 2; // Fixed baseline for demo

        if (neededStaff > currentScheduledStaff) {
            const proposal: StaffingProposal = {
                id: SharedKernel.generateId('PRP-STAFF'),
                targetDate: date,
                reason: `Saturation probable : ${predictedOrders} couverts prédits vs ${currentScheduledStaff} brigadiers prévus.`,
                currentStaffCount: currentScheduledStaff,
                suggestedStaffCount: neededStaff,
                predictedVelocity: predictedOrders,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            logger.warn(`[StaffingOracle] Staffing Gap Detected: ${proposal.reason}`);
            
            // Persist the proposal for Suzerain Approval
            await Nexus.adapter.set(Nexus.getTenantPath(`proposals/staffing/${proposal.id}`), proposal);
            
            return proposal;
        }

        return null;
    }

    /**
     * Approves a proposal and injects it into the planning.
     */
    static async approveProposal(proposalId: string): Promise<void> {
        const path = Nexus.getTenantPath(`proposals/staffing/${proposalId}`);
        const proposal = await Nexus.adapter.get(path) as StaffingProposal;

        if (proposal) {
            proposal.status = 'approved';
            await Nexus.adapter.set(path, proposal);
            logger.info(`[StaffingOracle] Proposal ${proposalId} APPROVED. Synchronizing HR Planning...`);
            // Add automated shift creation logic here
        }
    }
}
