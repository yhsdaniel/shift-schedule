export type JobRole = 'SM' | 'PIC' | 'STAFF';

export type ShiftCode = 'MORNING' | 'MIDDLE' | 'CLOSING';

export type TimeOffStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type ScheduleStatus = 'DRAFT' | 'PUBLISHED';

export interface Store {
  id: string;
  name: string;
  code: string;
  timezone: string;
  minimumRestHours: number; // e.g. 11 hours
  status: 'ACTIVE' | 'INACTIVE';
  address: string;
}

export interface Employee {
  id: string;
  storeId: string;
  employeeCode: string;
  name: string;
  jobRole: JobRole;
  isActive: boolean;
  avatarColor: string;
  phone?: string;
}

export interface ShiftTemplate {
  id: string;
  storeId: string;
  code: ShiftCode;
  name: string;
  startTime: string; // HH:mm e.g. "07:00"
  endTime: string;   // HH:mm e.g. "15:00"
  isOvernight: boolean;
  eligibleRoles: JobRole[];
  color: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
  };
}

export interface ShiftRequirement {
  id: string;
  storeId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday (or 1..7)
  shiftCode: ShiftCode;
  minStaff: number;
  maxStaff: number;
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  storeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: TimeOffStatus;
  reason: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface ScheduleAssignment {
  id: string;
  employeeId: string;
  workDate: string; // YYYY-MM-DD
  shiftCode: ShiftCode | 'OFF';
  isLocked: boolean;
  assignmentType: 'AUTO' | 'MANUAL';
  updatedAt: string;
}

export interface Schedule {
  id: string;
  storeId: string;
  weekStart: string; // Monday YYYY-MM-DD
  weekEnd: string;   // Sunday YYYY-MM-DD
  version: number;
  status: ScheduleStatus;
  assignments: ScheduleAssignment[];
  parentScheduleId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
}

export interface ConflictItem {
  id: string;
  code:
    | 'WEEKLY_OFF_VIOLATION'
    | 'APPROVED_OFF_VIOLATION'
    | 'OVERLAP_VIOLATION'
    | 'NO_PIC_MORNING'
    | 'NO_PIC_CLOSING'
    | 'REST_INTERVAL_VIOLATION'
    | 'STAFFING_UNDER_MIN'
    | 'STAFFING_OVER_MAX'
    | 'INELIGIBLE_ROLE'
    | 'LOCKED_CONFLICT';
  severity: 'ERROR' | 'WARNING';
  date?: string;
  employeeId?: string;
  shiftCode?: ShiftCode;
  message: string;
  recommendation?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ConflictItem[];
  warnings: ConflictItem[];
  summary: {
    totalEmployees: number;
    offComplianceCount: number;
    picCoverageDays: number;
    restIntervalViolations: number;
    staffingCompliantDays: number;
  };
}

export interface AuditLog {
  id: string;
  storeId: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
}
