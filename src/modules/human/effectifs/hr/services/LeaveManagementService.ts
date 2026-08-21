import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface LeaveRequest {
  requestId: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'cp' | 'rtt' | 'unpaid' | 'sick';
  startDateIso: string;
  endDateIso: string;
  daysCount: number;
  currentCpBalanceDays: number;
}

export interface LeaveDecisionResult {
  requestId: string;
  isApproved: boolean;
  newCpBalanceDays: number;
  rejectReason?: string;
  processedAt: number;
}

/**
 * LeaveManagementService — Angle mort G4.
 * Workflow de gestion des congés payés et RTT : contrôle des soldes de CP acquis, vérification du maintien d'un effectif minimum de service et audit de validation.
 */
export class LeaveManagementService {
  static async processLeaveRequest(
    adminId: string,
    req: LeaveRequest,
    isApprovedByManager: boolean,
    hasMinimumStaffCovered: boolean
  ): Promise<LeaveDecisionResult> {
    if (req.leaveType === 'cp' && req.daysCount > req.currentCpBalanceDays) {
      return {
        requestId: req.requestId,
        isApproved: false,
        newCpBalanceDays: req.currentCpBalanceDays,
        rejectReason: `Solde CP insuffisant (${req.currentCpBalanceDays} jours disponibles pour ${req.daysCount} demandés).`,
        processedAt: Date.now(),
      };
    }

    if (!hasMinimumStaffCovered) {
      return {
        requestId: req.requestId,
        isApproved: false,
        newCpBalanceDays: req.currentCpBalanceDays,
        rejectReason: 'Effectif minimum de cuisine/salle non garanti sur cette période.',
        processedAt: Date.now(),
      };
    }

    const isApproved = isApprovedByManager;
    const newCpBalanceDays = isApproved && req.leaveType === 'cp'
      ? req.currentCpBalanceDays - req.daysCount
      : req.currentCpBalanceDays;

    NexusEventBus.emit('hr.leave_request_processed', {
      v: 1,
      tenantId: req.tenantId,
      requestId: req.requestId,
      employeeId: req.employeeId,
      leaveType: req.leaveType,
      daysCount: req.daysCount,
      isApproved,
      processedAt: Date.now(),
    });

    if (isApproved) {
      await AuditLogger.logAction({
        adminId,
        action: 'LEAVE_REQUEST_APPROVED',
        targetId: req.requestId,
        ipAddress: '127.0.0.1',
        metadata: {
          employeeId: req.employeeId,
          leaveType: req.leaveType,
          daysCount: req.daysCount,
          newCpBalanceDays,
        },
      });
    }

    return {
      requestId: req.requestId,
      isApproved,
      newCpBalanceDays,
      processedAt: Date.now(),
    };
  }
}
