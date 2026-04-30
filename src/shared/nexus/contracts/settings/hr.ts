export type ContractType = 'cdi' | 'cdd' | 'extra' | 'intern' | 'apprentice';
export type Department = 'kitchen' | 'service' | 'bar' | 'admin';

export interface EmployeeSettings {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other';
    nationality?: string;
    address?: string;
    phone: string;
    email: string;
    emergencyContact?: { name: string; phone: string };
    socialSecurityNumber?: string;
    contractNumber?: string;
    contractType: ContractType;
    hireDate: string;
    endDate?: string;
    positionId: string;
    department: Department;
    hierarchyLevel?: number;
    managerId?: string;
    hourlyRate?: number;
    monthlySalary?: number;
    weeklyHours: number;
    hasHealthInsurance: boolean;
    hasMealVouchers: boolean;
    transportReimbursement?: number;
    bankDetails?: string;
    pinCode: string;
    systemRole: string;
    specificPermissions?: string[];
    languages?: string[];
    certifications?: string[];
    personalAllergies?: string[];
    uniformSize?: string;
    shoeSize?: number;
    isActive: boolean;
    terminationReason?: string;
    terminationDate?: string;
}

export interface PositionSettings {
    id: string;
    name: string;
    description?: string;
    department: Department;
    responsibilityLevel?: number;
    minHourlyRate?: number;
    maxHourlyRate?: number;
    requiredSkills?: string[];
    budgetedCount?: number;
    color?: string;
    overtimeRate?: number;
    breakDuration?: number;
}

export interface StaffConfig {
    maxHoursPerWeek: number;
    maxOvertimePerWeek: number;
    minRestBetweenShiftsHours: number;
    nightShiftStart: string;
    nightShiftBonusPercent: number;
    sundayBonusPercent: number;
    holidayBonusPercent: number;
    paidBreaks: boolean;
    autoScheduling: boolean;
    contractTypes: string[];
}

export interface ShiftTemplate {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    breakDuration: number;
    positionId?: string;
    workZone?: string;
    color: string;
    notes?: string;
}

export type AbsenceType = 'paid_leave' | 'rtt' | 'sick' | 'maternity' | 'unpaid' | 'training';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected';

export interface AbsenceSettings {
    id: string;
    employeeId: string;
    type: AbsenceType;
    startDate: string;
    endDate: string;
    isHalfDay: boolean;
    halfDayPeriod?: 'morning' | 'afternoon';
    status: AbsenceStatus;
    justificationFile?: string;
    employeeComment?: string;
    managerComment?: string;
    leaveBalanceBefore?: number;
    leaveBalanceAfter?: number;
}

export interface PlanningConfig {
    weekStartDay: number;
    defaultView: 'day' | 'week' | 'month';
    minHoursBetweenShifts: number;
    maxHoursPerDay: number;
    maxHoursPerWeek: number;
    notifyOnPublish: boolean;
    absenceRequestApproval: boolean;
    swapRequestApproval: boolean;
    overtimeEnabled: boolean;
    staffToCoversRatio: number; // Grade X Predictive Buffer
}
