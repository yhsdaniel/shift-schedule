'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Store,
  Employee,
  ShiftTemplate,
  ShiftRequirement,
  TimeOffRequest,
  Schedule,
  ScheduleAssignment,
  ValidationResult,
  AuditLog,
  ShiftCode,
  JobRole,
} from '@/types/scheduler';
import {
  INITIAL_STORES,
  INITIAL_EMPLOYEES,
  INITIAL_SHIFTS,
  INITIAL_SHIFT_REQUIREMENTS,
  INITIAL_TIME_OFF,
  INITIAL_AUDIT_LOGS,
  addDays,
} from '@/modules/data/initialData';
import { validateSchedule } from '@/modules/scheduling/validator';
import { generateConstraintSchedule } from '@/modules/scheduling/solver';

interface SchedulerContextType {
  stores: Store[];
  currentStore: Store;
  setCurrentStoreId: (storeId: string) => void;
  currentUserRole: 'SM' | 'ADMIN';
  setCurrentUserRole: (role: 'SM' | 'ADMIN') => void;

  weekStart: string;
  setWeekStart: (monday: string) => void;
  weekDates: string[];

  employees: Employee[];
  shifts: ShiftTemplate[];
  requirements: ShiftRequirement[];
  timeOffRequests: TimeOffRequest[];
  auditLogs: AuditLog[];

  currentSchedule: Schedule | null;
  scheduleHistory: Schedule[];
  validationResult: ValidationResult;

  // Actions
  generateScheduleAction: (options?: { minimalChange?: boolean }) => {
    success: boolean;
    message: string;
    changesCount?: number;
  };
  updateAssignment: (
    employeeId: string,
    workDate: string,
    shiftCode: ShiftCode | 'OFF',
    lock?: boolean
  ) => void;
  toggleLock: (employeeId: string, workDate: string) => void;
  publishScheduleAction: () => { success: boolean; message: string };
  approveTimeOffAction: (id: string) => void;
  rejectTimeOffAction: (id: string) => void;
  addTimeOffAction: (data: {
    employeeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => void;
  updateStoreSettings: (settings: Partial<Store>) => void;
  updateShiftTimes: (shifts: ShiftTemplate[]) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  restoreVersionAction: (versionId: string) => void;
  resetToInitialDemo: () => void;
}

const SchedulerContext = createContext<SchedulerContextType | undefined>(undefined);

const STORAGE_KEY = 'fnb_shift_scheduler_v1';

export function SchedulerProvider({ children }: { children: ReactNode }) {
  // Monday of the target week (e.g. 2026-10-19)
  const [weekStart, setWeekStart] = useState<string>('2026-10-19');
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  const [currentStoreId, setCurrentStoreId] = useState<string>('store_senopati');
  const [currentUserRole, setCurrentUserRole] = useState<'SM' | 'ADMIN'>('SM');

  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [shifts, setShifts] = useState<ShiftTemplate[]>(INITIAL_SHIFTS);
  const [requirements, setRequirements] = useState<ShiftRequirement[]>(INITIAL_SHIFT_REQUIREMENTS);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>(INITIAL_TIME_OFF);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [scheduleHistory, setScheduleHistory] = useState<Schedule[]>([]);

  // 7 days from Monday to Sunday
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const currentStore = useMemo(() => {
    return stores.find((s) => s.id === currentStoreId) || stores[0];
  }, [stores, currentStoreId]);

  // Load from local storage or initialize
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${currentStoreId}_${weekStart}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentSchedule) setCurrentSchedule(parsed.currentSchedule);
        if (parsed.scheduleHistory) setScheduleHistory(parsed.scheduleHistory);
        if (parsed.employees) setEmployees(parsed.employees);
        if (parsed.timeOffRequests) setTimeOffRequests(parsed.timeOffRequests);
        if (parsed.shifts) setShifts(parsed.shifts);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        return;
      } catch (e) {
        console.error('Error loading saved state:', e);
      }
    }

    // Auto-generate initial schedule if none exists
    const gen = generateConstraintSchedule(
      currentStore,
      employees.filter((e) => e.storeId === currentStoreId),
      shifts,
      requirements,
      timeOffRequests.filter((r) => r.storeId === currentStoreId),
      weekDates,
      { preserveLockedAssignments: false, minimalChangeFromBaseline: false }
    );

    const initialSched: Schedule = {
      id: `sched_${currentStoreId}_${weekStart}_v1`,
      storeId: currentStoreId,
      weekStart,
      weekEnd: weekDates[6],
      version: 1,
      status: 'PUBLISHED',
      assignments: gen.assignments,
      createdAt: '2026-10-14 08:30:00',
      updatedAt: '2026-10-14 09:00:00',
      publishedAt: '2026-10-14 09:00:00',
      publishedBy: 'Budi Santoso (SM)',
    };

    setCurrentSchedule(initialSched);
    setScheduleHistory([initialSched]);
  }, [currentStoreId, weekStart]);

  // Save to localStorage whenever key items change
  useEffect(() => {
    if (currentSchedule) {
      const state = {
        currentSchedule,
        scheduleHistory,
        employees,
        timeOffRequests,
        shifts,
        auditLogs,
      };
      localStorage.setItem(`${STORAGE_KEY}_${currentStoreId}_${weekStart}`, JSON.stringify(state));
    }
  }, [currentSchedule, scheduleHistory, employees, timeOffRequests, shifts, auditLogs, currentStoreId, weekStart]);

  // Real-time validation
  const validationResult = useMemo(() => {
    if (!currentSchedule) {
      return {
        isValid: false,
        errors: [],
        warnings: [],
        summary: {
          totalEmployees: employees.length,
          offComplianceCount: 0,
          picCoverageDays: 0,
          restIntervalViolations: 0,
          staffingCompliantDays: 0,
        },
      };
    }

    return validateSchedule(
      currentStore,
      employees.filter((e) => e.storeId === currentStoreId),
      shifts,
      requirements,
      timeOffRequests.filter((r) => r.storeId === currentStoreId),
      currentSchedule.assignments,
      weekDates
    );
  }, [currentStore, employees, shifts, requirements, timeOffRequests, currentSchedule, weekDates, currentStoreId]);

  // Action: Add audit log
  const addLog = (action: string, details: string) => {
    const actor = currentUserRole === 'ADMIN' ? 'System Admin' : `${employees[0]?.name || 'User'} (SM)`;
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      storeId: currentStoreId,
      actorName: actor,
      action,
      details,
      timestamp: new Date().toLocaleString('sv-SE'),
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Action: Generate schedule with constraints & minimal change
  const generateScheduleAction = (options: { minimalChange?: boolean } = { minimalChange: true }) => {
    const activeEmps = employees.filter((e) => e.storeId === currentStoreId && e.isActive);
    const storeTimeOff = timeOffRequests.filter((r) => r.storeId === currentStoreId);

    const result = generateConstraintSchedule(
      currentStore,
      activeEmps,
      shifts,
      requirements,
      storeTimeOff,
      weekDates,
      {
        preserveLockedAssignments: true,
        minimalChangeFromBaseline: options?.minimalChange ?? true,
        baselineAssignments: currentSchedule?.assignments || [],
      }
    );

    if (result.status === 'SUCCEEDED') {
      const newVersion = (currentSchedule?.version || 1) + 1;
      const newDraft: Schedule = {
        id: `sched_${currentStoreId}_${weekStart}_v${newVersion}`,
        storeId: currentStoreId,
        weekStart,
        weekEnd: weekDates[6],
        version: newVersion,
        status: 'DRAFT', // PRD Section 6 FR-04: Hasil generator disimpan sebagai Draft untuk review
        assignments: result.assignments,
        parentScheduleId: currentSchedule?.id,
        createdAt: new Date().toLocaleString('sv-SE'),
        updatedAt: new Date().toLocaleString('sv-SE'),
      };

      setCurrentSchedule(newDraft);
      setScheduleHistory((prev) => [newDraft, ...prev]);
      addLog(
        'GENERATE_SCHEDULE',
        `Menjalankan generator jadwal otomatis (Versi ${newVersion} Draft). Perubahan: ${result.changesCount} assignment.`
      );

      return {
        success: true,
        message: `Berhasil generate jadwal Draft v${newVersion}! (${result.changesCount} perubahan dalam ${result.durationMs}ms)`,
        changesCount: result.changesCount,
      };
    } else {
      addLog('GENERATE_FAILED', `Gagal generate jadwal: ${result.conflicts[0]?.message || 'Konflik konstrain'}`);
      return {
        success: false,
        message: result.conflicts[0]?.message || 'Gagal generate jadwal: Hard constraints tidak terpenuhi.',
      };
    }
  };

  // Action: Update single assignment
  const updateAssignment = (
    employeeId: string,
    workDate: string,
    shiftCode: ShiftCode | 'OFF',
    lock = true
  ) => {
    if (!currentSchedule) return;

    const emp = employees.find((e) => e.id === employeeId);
    const existingIdx = currentSchedule.assignments.findIndex(
      (a) => a.employeeId === employeeId && a.workDate === workDate
    );

    let updatedAssignments = [...currentSchedule.assignments];
    if (existingIdx !== -1) {
      updatedAssignments[existingIdx] = {
        ...updatedAssignments[existingIdx],
        shiftCode,
        isLocked: lock,
        assignmentType: 'MANUAL',
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedAssignments.push({
        id: `assign_${workDate}_${employeeId}`,
        employeeId,
        workDate,
        shiftCode,
        isLocked: lock,
        assignmentType: 'MANUAL',
        updatedAt: new Date().toISOString(),
      });
    }

    setCurrentSchedule({
      ...currentSchedule,
      status: 'DRAFT', // Any edit resets to DRAFT until re-published
      assignments: updatedAssignments,
      updatedAt: new Date().toLocaleString('sv-SE'),
    });

    addLog(
      'UPDATE_ASSIGNMENT',
      `Manual assignment untuk ${emp?.name || employeeId} pada ${workDate}: ${shiftCode} (Locked: ${lock}).`
    );
  };

  // Action: Toggle lock
  const toggleLock = (employeeId: string, workDate: string) => {
    if (!currentSchedule) return;
    const existingIdx = currentSchedule.assignments.findIndex(
      (a) => a.employeeId === employeeId && a.workDate === workDate
    );
    if (existingIdx === -1) return;

    const updatedAssignments = [...currentSchedule.assignments];
    const newLock = !updatedAssignments[existingIdx].isLocked;
    updatedAssignments[existingIdx] = {
      ...updatedAssignments[existingIdx],
      isLocked: newLock,
      updatedAt: new Date().toISOString(),
    };

    setCurrentSchedule({
      ...currentSchedule,
      assignments: updatedAssignments,
      updatedAt: new Date().toLocaleString('sv-SE'),
    });

    const emp = employees.find((e) => e.id === employeeId);
    addLog(
      newLock ? 'LOCK_ASSIGNMENT' : 'UNLOCK_ASSIGNMENT',
      `${newLock ? 'Mengunci' : 'Membuka kunci'} shift ${emp?.name} pada ${workDate}.`
    );
  };

  // Action: Publish schedule
  const publishScheduleAction = () => {
    if (!currentSchedule) return { success: false, message: 'Tidak ada jadwal aktif.' };

    // PRD HC-09: Hanya jadwal yang lolos seluruh hard constraints dapat dipublikasikan
    if (!validationResult.isValid) {
      const topError = validationResult.errors[0]?.message || 'Terdapat pelanggaran hard constraints.';
      addLog('PUBLISH_REJECTED', `Gagal publish: ${topError}`);
      return {
        success: false,
        message: `Tidak dapat memublikasikan jadwal: ${topError}`,
      };
    }

    const publishedSchedule: Schedule = {
      ...currentSchedule,
      status: 'PUBLISHED',
      publishedAt: new Date().toLocaleString('sv-SE'),
      publishedBy: currentUserRole === 'ADMIN' ? 'System Admin' : `${employees[0]?.name || 'SM'}`,
      updatedAt: new Date().toLocaleString('sv-SE'),
    };

    setCurrentSchedule(publishedSchedule);
    setScheduleHistory((prev) => [
      publishedSchedule,
      ...prev.filter((s) => s.id !== publishedSchedule.id),
    ]);

    addLog(
      'PUBLISH_SCHEDULE',
      `Memublikasikan Jadwal v${publishedSchedule.version} secara resmi untuk periode ${publishedSchedule.weekStart} s/d ${publishedSchedule.weekEnd}.`
    );

    return {
      success: true,
      message: `Jadwal versi ${publishedSchedule.version} resmi dipublikasikan!`,
    };
  };

  // Time off actions
  const approveTimeOffAction = (id: string) => {
    setTimeOffRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'APPROVED',
              approvedBy: currentUserRole === 'ADMIN' ? 'System Admin' : 'Budi Santoso (SM)',
              approvedAt: new Date().toLocaleString('sv-SE'),
            }
          : r
      )
    );
    const req = timeOffRequests.find((r) => r.id === id);
    const emp = employees.find((e) => e.id === req?.employeeId);
    addLog('APPROVE_TIMEOFF', `Menyetujui cuti untuk ${emp?.name} (${req?.startDate} - ${req?.endDate}).`);
  };

  const rejectTimeOffAction = (id: string) => {
    setTimeOffRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r))
    );
    const req = timeOffRequests.find((r) => r.id === id);
    const emp = employees.find((e) => e.id === req?.employeeId);
    addLog('REJECT_TIMEOFF', `Menolak permohonan cuti ${emp?.name} (${req?.startDate}).`);
  };

  const addTimeOffAction = (data: {
    employeeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    const newReq: TimeOffRequest = {
      id: `to_${Date.now()}`,
      employeeId: data.employeeId,
      storeId: currentStoreId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'PENDING',
      reason: data.reason,
      createdAt: new Date().toLocaleString('sv-SE'),
    };
    setTimeOffRequests((prev) => [newReq, ...prev]);
    const emp = employees.find((e) => e.id === data.employeeId);
    addLog('REQUEST_TIMEOFF', `Pengajuan cuti baru untuk ${emp?.name} (${data.startDate} s/d ${data.endDate}).`);
  };

  // Store & Settings actions
  const updateStoreSettings = (settings: Partial<Store>) => {
    setStores((prev) =>
      prev.map((s) => (s.id === currentStoreId ? { ...s, ...settings } : s))
    );
    addLog('UPDATE_STORE_SETTINGS', `Memperbarui konfigurasi toko (Rest Hours: ${settings.minimumRestHours || currentStore.minimumRestHours} jam).`);
  };

  const updateShiftTimes = (updatedShifts: ShiftTemplate[]) => {
    setShifts(updatedShifts);
    addLog('UPDATE_SHIFT_CONFIG', 'Memperbarui konfigurasi jam shift operasional.');
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    addLog('UPDATE_EMPLOYEE', `Memperbarui data karyawan ID: ${id}.`);
  };

  const restoreVersionAction = (versionId: string) => {
    const found = scheduleHistory.find((s) => s.id === versionId);
    if (found) {
      setCurrentSchedule(found);
      addLog('RESTORE_VERSION', `Mengembalikan jadwal ke Versi ${found.version} (${found.status}).`);
    }
  };

  const resetToInitialDemo = () => {
    localStorage.removeItem(`${STORAGE_KEY}_${currentStoreId}_${weekStart}`);
    setEmployees(INITIAL_EMPLOYEES);
    setShifts(INITIAL_SHIFTS);
    setRequirements(INITIAL_SHIFT_REQUIREMENTS);
    setTimeOffRequests(INITIAL_TIME_OFF);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setStores(INITIAL_STORES);
    window.location.reload();
  };

  return (
    <SchedulerContext.Provider
      value={{
        stores,
        currentStore,
        setCurrentStoreId,
        currentUserRole,
        setCurrentUserRole,
        weekStart,
        setWeekStart,
        weekDates,
        employees,
        shifts,
        requirements,
        timeOffRequests,
        auditLogs,
        currentSchedule,
        scheduleHistory,
        validationResult,
        generateScheduleAction,
        updateAssignment,
        toggleLock,
        publishScheduleAction,
        approveTimeOffAction,
        rejectTimeOffAction,
        addTimeOffAction,
        updateStoreSettings,
        updateShiftTimes,
        updateEmployee,
        restoreVersionAction,
        resetToInitialDemo,
      }}
    >
      {children}
    </SchedulerContext.Provider>
  );
}

export function useScheduler() {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error('useScheduler must be used within a SchedulerProvider');
  }
  return context;
}
