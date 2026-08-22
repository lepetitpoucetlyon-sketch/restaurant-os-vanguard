export interface HUMANEvents {
  'hr.transfer_offer': {
    v: 1;
    isSimulation?: boolean;
    fromTenantId: string;
    toTenantId: string;
    ownerId: string;
    headcount: number;
    bonusInMicrounits: number;
  };

  'hr.training_expired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    employeeId: string;
    trainingType: string;
  };

  'payroll.submitted': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    period: string;
    submissionId: string;
    employeeCount: number;
  };

  'hr.clock_in': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    timestamp: number;
  };

  'staff.clock_in': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    userName: string;
    terminalId: string;
    timestamp: string;
  };

  'staff.clock_out': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    userName: string;
    terminalId: string;
    timestamp: string;
  };

  'hr.absence_declared': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    absenceType: 'sick' | 'vacation' | 'unjustified';
    startDate: string;
    endDate?: string;
  };

  'hr.preroll_validated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    periodId: string;
    validatedBy: string;
    totalEmployees: number;
  };

  'hr.contract_expiring': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    contractId: string;
    expiryDate: string;
    daysRemaining: number;
  };

  'hr.medical_visit_expired': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    userId: string;
    expiryDate: string;
    daysOverdue: number;
  };

  'hr.application_received': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    applicationId: string;
    role: string;
    applicantName: string;
  };

  'hr.shift_started': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    shiftId: string;
    employeeId: string;
    startedAt: number;
    role: string;
  };

  'hr.shift_ended': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    shiftId: string;
    employeeId: string;
    endedAt: number;
  };

  'hr.schedule_published': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    weekStart: number;
    publishedBy: string;
  };

  'hr.payroll_exported': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    periodStart: number;
    periodEnd: number;
    exportedBy: string;
  };

  'overtime.threshold': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    employeeId: string;
    hoursWorked: number;
    hoursLimit: number;
    periodStart: string;
    periodEnd: string;
  };

  'hr.overtime_alert': { tenantId: string; employeeId: string; extraMinutes: number };

  'hr.tip_distributed': { tenantId: string; orderId: string; tipInMicrounits: number; staffIds: string[] };

  'hr.break_checked': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    employeeId: string;
    shiftId: string;
    shiftDurationHours: number;
    breakMinutes: number;
    required: boolean;
    compliant: boolean;
  };

  'hr.rest_period_violation': { v:1; tenantId: string; employeeId: string; shiftStartIso: string; previousShiftEndIso: string; gapMinutes: number; requiredMinutes: number; violatedAt: number };

  'hr.work_accident_declared': { v:1; tenantId: string; employeeId: string; accidentId: string; injuryType: string; reportedAt: number; cpamDeadlineAt: number };

  'hr.tip_redistribution_processed': { v:1; tenantId: string; poolId: string; periodLabel: string; totalInMicrounits: number; employeeCount: number; processedAt: number };

  'hr.auto_clockout_at_z': { v:1; tenantId: string; closedCount: number; closedEmployeeIds: string[]; zClosureAt: number };

  'hr.hcr_payroll_computed': { v:1; tenantId: string; employeeId: string; periodLabel: string; basePayInMicrounits: number; overtimeInMicrounits: number; nightBonusInMicrounits: number; totalGrossInMicrounits: number; computedAt: number };

  'hr.shift_planning_conflict_detected': { v:1; tenantId: string; employeeId: string; shiftId: string; conflictType: 'overlap' | 'daily_amplitude_exceeded' | 'daily_rest_insufficient' | 'weekly_rest_insufficient'; detectedAt: number };

  'hr.time_clock_punched': { v:1; tenantId: string; employeeId: string; punchType: 'in' | 'out' | 'break_start' | 'break_end'; timestampUtc: number; isGeofenceValid: boolean; punchedAt: number };

  'hr.leave_request_processed': { v:1; tenantId: string; requestId: string; employeeId: string; leaveType: 'cp' | 'rtt' | 'unpaid' | 'sick'; daysCount: number; isApproved: boolean; processedAt: number };

  'hr.dpae_submitted': { v:1; tenantId: string; employeeId: string; urssafDpaeReference: string; hireDateIso: string; submittedAt: number };

  'hr.weekly_rest_proof_recorded': { v:1; tenantId: string; employeeId: string; weekIso: string; consecutiveRestHours: number; isLegalCompliant: boolean; recordedAt: number };
}
