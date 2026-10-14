import {
  Employee,
  ShiftTemplate,
  ShiftRequirement,
  TimeOffRequest,
  ScheduleAssignment,
  ConflictItem,
  ValidationResult,
  Store,
  ShiftCode,
} from '@/types/scheduler';

export function calculateRestHours(
  shiftPrev: ShiftTemplate | null,
  shiftCurr: ShiftTemplate | null
): number {
  if (!shiftPrev || !shiftCurr) return 24; // If either is OFF or not scheduled, plenty of rest

  const [prevEndH, prevEndM] = shiftPrev.endTime.split(':').map(Number);
  const [currStartH, currStartM] = shiftCurr.startTime.split(':').map(Number);

  // prev end is on day 1 (0 to 24), curr start is on day 2 (24 to 48)
  const prevEndInMinutes = prevEndH * 60 + prevEndM;
  let currStartInMinutes = (24 + currStartH) * 60 + currStartM;

  if (shiftPrev.isOvernight) {
    // If prev was overnight, it actually ended on day 2 morning
    // e.g. started 22:00, ended 06:00
    // so prevEndInMinutes is already on day 2
    currStartInMinutes = currStartH * 60 + currStartM;
  }

  const diffMinutes = currStartInMinutes - prevEndInMinutes;
  return diffMinutes / 60;
}

export function validateSchedule(
  store: Store,
  employees: Employee[],
  shifts: ShiftTemplate[],
  requirements: ShiftRequirement[],
  timeOffRequests: TimeOffRequest[],
  assignments: ScheduleAssignment[],
  dates: string[] // 7 days of the week
): ValidationResult {
  const errors: ConflictItem[] = [];
  const warnings: ConflictItem[] = [];

  const employeeMap = new Map(employees.map((e) => [e.id, e]));
  const shiftMap = new Map(shifts.map((s) => [s.code, s]));
  const approvedOffRequests = timeOffRequests.filter((r) => r.status === 'APPROVED');
  const pendingOffRequests = timeOffRequests.filter((r) => r.status === 'PENDING');

  // Build lookup: date -> employeeId -> assignment
  const grid: Record<string, Record<string, ScheduleAssignment>> = {};
  for (const date of dates) {
    grid[date] = {};
  }
  for (const a of assignments) {
    if (grid[a.workDate]) {
      grid[a.workDate][a.employeeId] = a;
    }
  }

  // 1. HC-01: Exactly 2 OFF days per employee per 7-day week
  let offComplianceCount = 0;
  for (const emp of employees.filter((e) => e.isActive)) {
    let offDays = 0;
    let workDays = 0;

    for (const date of dates) {
      const a = grid[date]?.[emp.id];
      if (!a || a.shiftCode === 'OFF') {
        offDays++;
      } else {
        workDays++;
      }
    }

    if (offDays !== 2) {
      errors.push({
        id: `err_off_${emp.id}`,
        code: 'WEEKLY_OFF_VIOLATION',
        severity: 'ERROR',
        employeeId: emp.id,
        message: `${emp.name} (${emp.jobRole}) memiliki ${offDays} hari OFF (${workDays} hari kerja). Wajib tepat 2 hari OFF seminggu.`,
        recommendation: `Sesuaikan jadwal ${emp.name} agar memiliki tepat 2 hari OFF.`,
      });
    } else {
      offComplianceCount++;
    }
  }

  // 2. HC-02: Approved Time Off & Warnings for Pending Time Off
  for (const req of approvedOffRequests) {
    const emp = employeeMap.get(req.employeeId);
    if (!emp) continue;

    for (const date of dates) {
      if (date >= req.startDate && date <= req.endDate) {
        const a = grid[date]?.[emp.id];
        if (a && a.shiftCode !== 'OFF') {
          errors.push({
            id: `err_approved_off_${emp.id}_${date}`,
            code: 'APPROVED_OFF_VIOLATION',
            severity: 'ERROR',
            date,
            employeeId: emp.id,
            message: `${emp.name} dijadwalkan shift ${a.shiftCode} pada ${date}, padahal memiliki cuti/off APPROVED (${req.reason}).`,
            recommendation: `Ubah shift menjadi OFF untuk menghormati cuti yang telah disetujui.`,
          });
        }
      }
    }
  }

  for (const req of pendingOffRequests) {
    const emp = employeeMap.get(req.employeeId);
    if (!emp) continue;

    for (const date of dates) {
      if (date >= req.startDate && date <= req.endDate) {
        const a = grid[date]?.[emp.id];
        if (a && a.shiftCode !== 'OFF') {
          warnings.push({
            id: `warn_pending_off_${emp.id}_${date}`,
            code: 'APPROVED_OFF_VIOLATION',
            severity: 'WARNING',
            date,
            employeeId: emp.id,
            message: `${emp.name} memiliki permohonan off PENDING pada ${date} ("${req.reason}").`,
            recommendation: `Tinjau permohonan cuti di tab Request Off sebelum finalisasi publish.`,
          });
        }
      }
    }
  }

  // 3. HC-04 & HC-06: PIC Coverage and Staffing requirements per day
  let picCoverageDays = 0;
  let staffingCompliantDays = 0;
  let restIntervalViolations = 0;

  dates.forEach((date, dayIdx) => {
    const dayOfWeek = (new Date(date).getDay() === 0 ? 7 : new Date(date).getDay());
    const dayAssignments = Object.values(grid[date] || {});

    // Count shifts
    const shiftCounts: Record<ShiftCode, Employee[]> = {
      MORNING: [],
      MIDDLE: [],
      CLOSING: [],
    };

    for (const a of dayAssignments) {
      if (a.shiftCode !== 'OFF') {
        const emp = employeeMap.get(a.employeeId);
        if (emp && emp.isActive) {
          shiftCounts[a.shiftCode]?.push(emp);
        }
      }
    }

    // Check PIC Coverage (SM counts as PIC)
    // Morning PIC
    const morningPICs = shiftCounts.MORNING.filter(
      (e) => e.jobRole === 'SM' || e.jobRole === 'PIC'
    );
    // Closing PIC
    const closingPICs = shiftCounts.CLOSING.filter(
      (e) => e.jobRole === 'SM' || e.jobRole === 'PIC'
    );

    let dayPicOk = true;
    if (morningPICs.length < 1) {
      dayPicOk = false;
      errors.push({
        id: `err_no_pic_m_${date}`,
        code: 'NO_PIC_MORNING',
        severity: 'ERROR',
        date,
        shiftCode: 'MORNING',
        message: `Tidak ada PIC bertugas di shift Pagi pada tanggal ${date}. Wajib minimal 1 PIC/SM.`,
        recommendation: `Tugaskan SM atau PIC pada shift Pagi.`,
      });
    }

    if (closingPICs.length < 1) {
      dayPicOk = false;
      errors.push({
        id: `err_no_pic_c_${date}`,
        code: 'NO_PIC_CLOSING',
        severity: 'ERROR',
        date,
        shiftCode: 'CLOSING',
        message: `Tidak ada PIC bertugas di shift Closing pada tanggal ${date}. Wajib minimal 1 PIC/SM.`,
        recommendation: `Tugaskan SM atau PIC pada shift Closing.`,
      });
    }

    if (dayPicOk) picCoverageDays++;

    // Check Staffing min/max per shift requirement
    let dayStaffingOk = true;
    const reqsForDay = requirements.filter((r) => r.dayOfWeek === dayOfWeek);
    for (const req of reqsForDay) {
      const count = shiftCounts[req.shiftCode]?.length || 0;
      if (count < req.minStaff) {
        dayStaffingOk = false;
        errors.push({
          id: `err_staff_min_${date}_${req.shiftCode}`,
          code: 'STAFFING_UNDER_MIN',
          severity: 'ERROR',
          date,
          shiftCode: req.shiftCode,
          message: `Shift ${req.shiftCode} pada ${date} kekurangan staf (${count}/${req.minStaff} min).`,
          recommendation: `Tambah staf pada shift ${req.shiftCode}.`,
        });
      } else if (count > req.maxStaff) {
        dayStaffingOk = false;
        warnings.push({
          id: `warn_staff_max_${date}_${req.shiftCode}`,
          code: 'STAFFING_OVER_MAX',
          severity: 'WARNING',
          date,
          shiftCode: req.shiftCode,
          message: `Shift ${req.shiftCode} pada ${date} melebihi kapasitas maksimum (${count}/${req.maxStaff} max).`,
          recommendation: `Kurangi staf pada shift ${req.shiftCode}.`,
        });
      }
    }
    if (dayStaffingOk) staffingCompliantDays++;
  });

  // 4. HC-05: Rest interval between consecutive days
  for (let d = 0; d < dates.length - 1; d++) {
    const currDate = dates[d];
    const nextDate = dates[d + 1];

    for (const emp of employees.filter((e) => e.isActive)) {
      const assignCurr = grid[currDate]?.[emp.id];
      const assignNext = grid[nextDate]?.[emp.id];

      if (
        assignCurr &&
        assignCurr.shiftCode !== 'OFF' &&
        assignNext &&
        assignNext.shiftCode !== 'OFF'
      ) {
        const shiftCurr = shiftMap.get(assignCurr.shiftCode) || null;
        const shiftNext = shiftMap.get(assignNext.shiftCode) || null;

        const restHours = calculateRestHours(shiftCurr, shiftNext);
        if (restHours < store.minimumRestHours) {
          restIntervalViolations++;
          errors.push({
            id: `err_rest_${emp.id}_${currDate}_${nextDate}`,
            code: 'REST_INTERVAL_VIOLATION',
            severity: 'ERROR',
            date: nextDate,
            employeeId: emp.id,
            message: `${emp.name} mengalami pelanggaran rest interval: ${assignCurr.shiftCode} (${currDate}) lalu ${assignNext.shiftCode} (${nextDate}) hanya jeda ${restHours} jam (minimum toko ${store.minimumRestHours} jam).`,
            recommendation: `Hindari rotasi Closing ke Pagi berturut-turut untuk ${emp.name}.`,
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalEmployees: employees.filter((e) => e.isActive).length,
      offComplianceCount,
      picCoverageDays,
      restIntervalViolations,
      staffingCompliantDays,
    },
  };
}
