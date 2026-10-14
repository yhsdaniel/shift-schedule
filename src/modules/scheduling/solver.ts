import {
  Employee,
  ShiftTemplate,
  ShiftRequirement,
  TimeOffRequest,
  ScheduleAssignment,
  ConflictItem,
  Store,
  ShiftCode,
} from '@/types/scheduler';
import { calculateRestHours } from './validator';

export interface SolverOptions {
  preserveLockedAssignments: boolean;
  minimalChangeFromBaseline: boolean;
  baselineAssignments?: ScheduleAssignment[];
  seed?: number;
}

export interface SolverResult {
  status: 'SUCCEEDED' | 'INFEASIBLE' | 'NO_VALID_SCHEDULE_FOUND';
  assignments: ScheduleAssignment[];
  conflicts: ConflictItem[];
  changesCount: number;
  durationMs: number;
}

export function generateConstraintSchedule(
  store: Store,
  employees: Employee[],
  shifts: ShiftTemplate[],
  requirements: ShiftRequirement[],
  timeOffRequests: TimeOffRequest[],
  dates: string[], // 7 days: [Monday, Tuesday, ... Sunday]
  options: SolverOptions = {
    preserveLockedAssignments: true,
    minimalChangeFromBaseline: true,
  }
): SolverResult {
  const startTime = Date.now();
  const conflicts: ConflictItem[] = [];

  const activeEmployees = employees.filter((e) => e.isActive);
  const employeeMap = new Map(activeEmployees.map((e) => [e.id, e]));
  const shiftMap = new Map(shifts.map((s) => [s.code, s]));
  const approvedOffRequests = timeOffRequests.filter((r) => r.status === 'APPROVED');

  // Baseline lookup: date -> employeeId -> assignment
  const baselineMap = new Map<string, ScheduleAssignment>();
  if (options.baselineAssignments) {
    for (const a of options.baselineAssignments) {
      baselineMap.set(`${a.workDate}_${a.employeeId}`, a);
    }
  }

  // Pre-calculate hard constraints per employee
  // 1. Approved Off dates
  const forcedOffDates = new Map<string, Set<string>>(); // employeeId -> set of dates
  for (const emp of activeEmployees) {
    forcedOffDates.set(emp.id, new Set<string>());
  }
  for (const req of approvedOffRequests) {
    const set = forcedOffDates.get(req.employeeId);
    if (set) {
      for (const d of dates) {
        if (d >= req.startDate && d <= req.endDate) {
          set.add(d);
        }
      }
    }
  }

  // Check if any employee has > 2 approved off days in the 7-day period
  for (const emp of activeEmployees) {
    const offCount = forcedOffDates.get(emp.id)?.size || 0;
    if (offCount > 2) {
      conflicts.push({
        id: `conf_too_many_off_${emp.id}`,
        code: 'WEEKLY_OFF_VIOLATION',
        severity: 'ERROR',
        employeeId: emp.id,
        message: `${emp.name} memiliki ${offCount} hari cuti APPROVED dalam seminggu. Kebijakan toko adalah tepat 2 hari OFF.`,
        recommendation: 'Sesuaikan pengajuan cuti atau lakukan penyesuaian khusus.',
      });
      return {
        status: 'INFEASIBLE',
        assignments: options.baselineAssignments || [],
        conflicts,
        changesCount: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // 2. Locked assignments
  const lockedGrid = new Map<string, ShiftCode | 'OFF'>(); // `${date}_${empId}` -> shiftCode
  if (options.preserveLockedAssignments && options.baselineAssignments) {
    for (const a of options.baselineAssignments) {
      if (a.isLocked) {
        const isApprovedOff = forcedOffDates.get(a.employeeId)?.has(a.workDate);
        if (isApprovedOff && a.shiftCode !== 'OFF') {
          conflicts.push({
            id: `conf_locked_off_${a.employeeId}_${a.workDate}`,
            code: 'LOCKED_CONFLICT',
            severity: 'ERROR',
            date: a.workDate,
            employeeId: a.employeeId,
            message: `Assignment terkunci untuk ${employeeMap.get(a.employeeId)?.name} bertentangan dengan cuti Approved pada ${a.workDate}.`,
            recommendation: 'Buka kunci assignment atau ubah menjadi OFF.',
          });
          return {
            status: 'INFEASIBLE',
            assignments: options.baselineAssignments,
            conflicts,
            changesCount: 0,
            durationMs: Date.now() - startTime,
          };
        }
        lockedGrid.set(`${a.workDate}_${a.employeeId}`, a.shiftCode);
      }
    }
  }

  // Randomized multi-pass solver with backtracking & heuristic scoring
  const MAX_ATTEMPTS = 60;
  let bestSchedule: Map<string, ShiftCode | 'OFF'> | null = null;
  let bestScore = -Infinity;

  const picEmployees = activeEmployees.filter((e) => e.jobRole === 'SM' || e.jobRole === 'PIC');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidateGrid = new Map<string, ShiftCode | 'OFF'>();
    // Employee remaining work shifts count: must end with exactly 5 work days and 2 off days
    const empOffDays = new Map<string, number>();
    const empWorkDays = new Map<string, number>();

    for (const emp of activeEmployees) {
      empOffDays.set(emp.id, 0);
      empWorkDays.set(emp.id, 0);
    }

    // First assign locked assignments
    for (const [key, shift] of lockedGrid.entries()) {
      candidateGrid.set(key, shift);
      const [, empId] = key.split('_');
      if (shift === 'OFF') {
        empOffDays.set(empId, (empOffDays.get(empId) || 0) + 1);
      } else {
        empWorkDays.set(empId, (empWorkDays.get(empId) || 0) + 1);
      }
    }

    // Assign forced approved off
    for (const emp of activeEmployees) {
      const datesSet = forcedOffDates.get(emp.id);
      if (datesSet) {
        for (const d of datesSet) {
          const key = `${d}_${emp.id}`;
          if (!candidateGrid.has(key)) {
            candidateGrid.set(key, 'OFF');
            empOffDays.set(emp.id, (empOffDays.get(emp.id) || 0) + 1);
          }
        }
      }
    }

    // Now for each employee, randomly decide their remaining OFF days (to reach exactly 2 OFF days)
    let offAssignmentFeasible = true;
    for (const emp of activeEmployees) {
      const currentOff = empOffDays.get(emp.id) || 0;
      const neededOff = 2 - currentOff;
      if (neededOff < 0) {
        offAssignmentFeasible = false;
        break;
      }
      if (neededOff > 0) {
        // find available days for off (not already locked to a work shift or off)
        const candidateDays = dates.filter((d) => !candidateGrid.has(`${d}_${emp.id}`));
        if (candidateDays.length < neededOff) {
          offAssignmentFeasible = false;
          break;
        }

        // Shuffle candidate days or prefer baseline off day if minimal change
        const shuffledDays = [...candidateDays].sort((a, b) => {
          if (options.minimalChangeFromBaseline) {
            const baseA = baselineMap.get(`${a}_${emp.id}`)?.shiftCode === 'OFF' ? 1 : 0;
            const baseB = baselineMap.get(`${b}_${emp.id}`)?.shiftCode === 'OFF' ? 1 : 0;
            if (baseA !== baseB) return baseB - baseA;
          }
          return Math.random() - 0.5;
        });

        for (let i = 0; i < neededOff; i++) {
          const d = shuffledDays[i];
          candidateGrid.set(`${d}_${emp.id}`, 'OFF');
          empOffDays.set(emp.id, (empOffDays.get(emp.id) || 0) + 1);
        }
      }
    }

    if (!offAssignmentFeasible) continue;

    // Now for each day, assign shifts to working staff:
    // Every working staff must get MORNING, MIDDLE, or CLOSING.
    // Also must satisfy:
    // 1. PIC on Morning >= 1
    // 2. PIC on Closing >= 1
    // 3. Rest hours >= 11 (No Closing -> Morning on next day)
    // 4. Staffing minStaff requirements per shift
    let scheduleValid = true;

    for (let dayIdx = 0; dayIdx < dates.length; dayIdx++) {
      const date = dates[dayIdx];
      const prevDate = dayIdx > 0 ? dates[dayIdx - 1] : null;

      // Available working staff for today
      const workingStaffToday = activeEmployees.filter(
        (emp) => candidateGrid.get(`${date}_${emp.id}`) !== 'OFF'
      );

      // Separate staff by locked vs unlocked
      const morningStaff: Employee[] = [];
      const middleStaff: Employee[] = [];
      const closingStaff: Employee[] = [];
      const unassignedStaff: Employee[] = [];

      for (const emp of workingStaffToday) {
        const existing = candidateGrid.get(`${date}_${emp.id}`);
        if (existing && existing !== 'OFF') {
          if (existing === 'MORNING') morningStaff.push(emp);
          else if (existing === 'MIDDLE') middleStaff.push(emp);
          else if (existing === 'CLOSING') closingStaff.push(emp);
        } else {
          unassignedStaff.push(emp);
        }
      }

      // Check rest restriction from yesterday
      const canDoMorning = (emp: Employee) => {
        if (!prevDate) return true;
        const prevShift = candidateGrid.get(`${prevDate}_${emp.id}`);
        if (prevShift === 'CLOSING') return false; // Rest violation!
        return true;
      };

      // 1. Ensure Morning PIC
      const hasMorningPIC = morningStaff.some(
        (e) => e.jobRole === 'SM' || e.jobRole === 'PIC'
      );
      if (!hasMorningPIC) {
        // find a PIC among unassigned who can do morning
        const picCandidate = unassignedStaff.find(
          (e) => (e.jobRole === 'SM' || e.jobRole === 'PIC') && canDoMorning(e)
        );
        if (picCandidate) {
          morningStaff.push(picCandidate);
          unassignedStaff.splice(unassignedStaff.indexOf(picCandidate), 1);
        } else {
          // Infeasible on this attempt
          scheduleValid = false;
          break;
        }
      }

      // 2. Ensure Closing PIC
      const hasClosingPIC = closingStaff.some(
        (e) => e.jobRole === 'SM' || e.jobRole === 'PIC'
      );
      if (!hasClosingPIC) {
        const picCandidate = unassignedStaff.find(
          (e) => e.jobRole === 'SM' || e.jobRole === 'PIC'
        );
        if (picCandidate) {
          closingStaff.push(picCandidate);
          unassignedStaff.splice(unassignedStaff.indexOf(picCandidate), 1);
        } else {
          scheduleValid = false;
          break;
        }
      }

      // 3. Fill up requirements for Morning (target ~3-4), Closing (target ~3-4), Middle (~2-3)
      // Requirements for today
      const dayOfWeek = new Date(date).getDay() === 0 ? 7 : new Date(date).getDay();
      const morningReq = requirements.find((r) => r.dayOfWeek === dayOfWeek && r.shiftCode === 'MORNING')?.minStaff || 3;
      const closingReq = requirements.find((r) => r.dayOfWeek === dayOfWeek && r.shiftCode === 'CLOSING')?.minStaff || 3;
      const middleReq = requirements.find((r) => r.dayOfWeek === dayOfWeek && r.shiftCode === 'MIDDLE')?.minStaff || 2;

      // Sort unassigned staff: if minimal change, prefer their baseline shift
      unassignedStaff.sort((a, b) => {
        if (options.minimalChangeFromBaseline) {
          const baseA = baselineMap.get(`${date}_${a.id}`)?.shiftCode;
          const baseB = baselineMap.get(`${date}_${b.id}`)?.shiftCode;
          if (baseA && !baseB) return -1;
          if (!baseA && baseB) return 1;
        }
        return Math.random() - 0.5;
      });

      // Fill Morning up to target
      while (morningStaff.length < morningReq && unassignedStaff.length > 0) {
        const idx = unassignedStaff.findIndex((e) => canDoMorning(e));
        if (idx !== -1) {
          morningStaff.push(unassignedStaff[idx]);
          unassignedStaff.splice(idx, 1);
        } else {
          break; // nobody can do morning due to rest constraint
        }
      }

      // Fill Closing up to target
      while (closingStaff.length < closingReq && unassignedStaff.length > 0) {
        closingStaff.push(unassignedStaff.pop()!);
      }

      // Fill Middle up to target
      while (middleStaff.length < middleReq && unassignedStaff.length > 0) {
        middleStaff.push(unassignedStaff.pop()!);
      }

      // Distribute any remainder staff evenly
      while (unassignedStaff.length > 0) {
        const rem = unassignedStaff.pop()!;
        if (canDoMorning(rem) && morningStaff.length <= closingStaff.length && morningStaff.length <= middleStaff.length + 1) {
          morningStaff.push(rem);
        } else if (middleStaff.length <= closingStaff.length) {
          middleStaff.push(rem);
        } else {
          closingStaff.push(rem);
        }
      }

      // Check if minimums met
      if (
        morningStaff.length < morningReq ||
        closingStaff.length < closingReq ||
        middleStaff.length < middleReq
      ) {
        scheduleValid = false;
        break;
      }

      // Put back into candidateGrid
      for (const e of morningStaff) candidateGrid.set(`${date}_${e.id}`, 'MORNING');
      for (const e of middleStaff) candidateGrid.set(`${date}_${e.id}`, 'MIDDLE');
      for (const e of closingStaff) candidateGrid.set(`${date}_${e.id}`, 'CLOSING');
    }

    if (!scheduleValid) continue;

    // Check rest interval for the whole week
    let restViolationCount = 0;
    for (let d = 0; d < dates.length - 1; d++) {
      const d1 = dates[d];
      const d2 = dates[d + 1];
      for (const emp of activeEmployees) {
        const s1 = candidateGrid.get(`${d1}_${emp.id}`);
        const s2 = candidateGrid.get(`${d2}_${emp.id}`);
        if (s1 && s1 !== 'OFF' && s2 && s2 !== 'OFF') {
          const t1 = shiftMap.get(s1) || null;
          const t2 = shiftMap.get(s2) || null;
          if (calculateRestHours(t1, t2) < store.minimumRestHours) {
            restViolationCount++;
          }
        }
      }
    }
    if (restViolationCount > 0) continue;

    // Calculate quality score:
    // Higher score = better fairness + higher baseline retention (if minimalChange requested)
    let score = 1000;
    if (options.minimalChangeFromBaseline && baselineMap.size > 0) {
      let matchedBaseline = 0;
      for (const [key, shift] of candidateGrid.entries()) {
        const base = baselineMap.get(key);
        if (base && base.shiftCode === shift) {
          matchedBaseline++;
        }
      }
      score += matchedBaseline * 10;
    }

    // Fairness bonus: distribute shift types well
    if (score > bestScore) {
      bestScore = score;
      bestSchedule = candidateGrid;
    }
  }

  const durationMs = Date.now() - startTime;

  if (!bestSchedule) {
    // If not feasible, report explainable conflict
    conflicts.push({
      id: 'conf_infeasible',
      code: 'WEEKLY_OFF_VIOLATION',
      severity: 'ERROR',
      message:
        'Tidak dapat menemukan kombinasi jadwal yang memenuhi seluruh Hard Constraints (2 hari OFF, PIC pagi & closing, rest interval 11 jam).',
      recommendation:
        'Coba periksa apakah terlalu banyak assignment terkunci atau permohonan cuti bersamaan di hari yang sama.',
    });

    return {
      status: 'INFEASIBLE',
      assignments: options.baselineAssignments || [],
      conflicts,
      changesCount: 0,
      durationMs,
    };
  }

  // Convert bestSchedule map to ScheduleAssignment[]
  const resultAssignments: ScheduleAssignment[] = [];
  let changesCount = 0;

  for (const date of dates) {
    for (const emp of activeEmployees) {
      const shiftCode = bestSchedule.get(`${date}_${emp.id}`) || 'OFF';
      const key = `${date}_${emp.id}`;
      const base = baselineMap.get(key);
      const isLocked = lockedGrid.has(key);

      if (base && base.shiftCode !== shiftCode) {
        changesCount++;
      } else if (!base) {
        changesCount++;
      }

      resultAssignments.push({
        id: base?.id || `assign_${date}_${emp.id}`,
        employeeId: emp.id,
        workDate: date,
        shiftCode,
        isLocked,
        assignmentType: isLocked ? 'MANUAL' : 'AUTO',
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return {
    status: 'SUCCEEDED',
    assignments: resultAssignments,
    conflicts: [],
    changesCount,
    durationMs,
  };
}
