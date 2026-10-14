'use client';

import React, { useState, useMemo } from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import {
  ShiftCode,
  Employee,
  ScheduleAssignment,
} from '@/types/scheduler';
import {
  Lock,
  Unlock,
  Sun,
  Sunset,
  Moon,
  Coffee,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Eye,
  Calendar,
  Grid3X3,
  List,
  Sparkles,
  Info,
} from 'lucide-react';

export function WeeklyScheduleView() {
  const {
    currentStore,
    employees,
    shifts,
    currentSchedule,
    weekDates,
    updateAssignment,
    toggleLock,
    timeOffRequests,
    validationResult,
  } = useScheduler();

  // Mode: 'DAY' for mobile-first day-by-day swipe/list, 'MATRIX' for full 7-day table
  const [viewMode, setViewMode] = useState<'DAY' | 'MATRIX'>('DAY');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SM' | 'PIC' | 'STAFF'>('ALL');

  // Quick edit modal state
  const [editingAssignment, setEditingAssignment] = useState<{
    employee: Employee;
    date: string;
    currentShift: ShiftCode | 'OFF';
    isLocked: boolean;
  } | null>(null);

  const selectedDate = weekDates[selectedDayIdx] || weekDates[0];

  const activeEmployees = useMemo(() => {
    return employees
      .filter((e) => e.storeId === currentStore.id && e.isActive)
      .filter((e) => roleFilter === 'ALL' || e.jobRole === roleFilter);
  }, [employees, currentStore.id, roleFilter]);

  // Lookup map: `${date}_${empId}` -> ScheduleAssignment
  const assignmentMap = useMemo(() => {
    const map = new Map<string, ScheduleAssignment>();
    if (currentSchedule?.assignments) {
      for (const a of currentSchedule.assignments) {
        map.set(`${a.workDate}_${a.employeeId}`, a);
      }
    }
    return map;
  }, [currentSchedule]);

  // Approved off requests lookup: `${date}_${empId}` -> string reason
  const approvedOffMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const req of timeOffRequests) {
      if (req.status === 'APPROVED' && req.storeId === currentStore.id) {
        for (const d of weekDates) {
          if (d >= req.startDate && d <= req.endDate) {
            map.set(`${d}_${req.employeeId}`, req.reason);
          }
        }
      }
    }
    return map;
  }, [timeOffRequests, currentStore.id, weekDates]);

  // Day of week labels in Indonesian
  const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const dayShortLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Calculate stats for the selected day
  const dayStats = useMemo(() => {
    const morningStaff: Employee[] = [];
    const middleStaff: Employee[] = [];
    const closingStaff: Employee[] = [];
    const offStaff: Employee[] = [];

    for (const emp of employees.filter((e) => e.storeId === currentStore.id && e.isActive)) {
      const a = assignmentMap.get(`${selectedDate}_${emp.id}`);
      const shift = a?.shiftCode || 'OFF';

      if (shift === 'MORNING') morningStaff.push(emp);
      else if (shift === 'MIDDLE') middleStaff.push(emp);
      else if (shift === 'CLOSING') closingStaff.push(emp);
      else offStaff.push(emp);
    }

    const morningPIC = morningStaff.filter((e) => e.jobRole === 'SM' || e.jobRole === 'PIC');
    const closingPIC = closingStaff.filter((e) => e.jobRole === 'SM' || e.jobRole === 'PIC');

    return {
      morningStaff,
      middleStaff,
      closingStaff,
      offStaff,
      morningPIC,
      closingPIC,
      totalWorking: morningStaff.length + middleStaff.length + closingStaff.length,
    };
  }, [selectedDate, employees, currentStore.id, assignmentMap]);

  // Check if a specific day has issues
  const dayStatusCheck = (dateStr: string) => {
    const hasErr = validationResult.errors.some((e) => e.date === dateStr);
    return !hasErr;
  };

  // Helper for shift styling
  const getShiftBadge = (shift: ShiftCode | 'OFF') => {
    switch (shift) {
      case 'MORNING':
        return {
          label: 'Pagi',
          time: '07:00 - 15:00',
          icon: Sun,
          className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30',
          dot: 'bg-amber-500',
        };
      case 'MIDDLE':
        return {
          label: 'Middle',
          time: '11:00 - 19:00',
          icon: Sunset,
          className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/30',
          dot: 'bg-sky-500',
        };
      case 'CLOSING':
        return {
          label: 'Closing',
          time: '15:00 - 23:00',
          icon: Moon,
          className: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-400/30',
          dot: 'bg-purple-500',
        };
      case 'OFF':
      default:
        return {
          label: 'OFF',
          time: 'Libur',
          icon: Coffee,
          className: 'bg-stone-500/15 text-stone-600 dark:text-stone-400 border-stone-400/20',
          dot: 'bg-stone-400',
        };
    }
  };

  // Count employee's off days across the whole 7-day week
  const getEmployeeOffCount = (empId: string) => {
    let off = 0;
    for (const d of weekDates) {
      const a = assignmentMap.get(`${d}_${empId}`);
      if (!a || a.shiftCode === 'OFF') off++;
    }
    return off;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Controls Bar: View Mode Switcher, Role Filter, Day Quick Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/60 p-2.5 rounded-2xl border border-stone-800">
        {/* View mode toggle (Harian vs Matriks) */}
        <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl self-start sm:self-auto border border-stone-700/60">
          <button
            onClick={() => setViewMode('DAY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'DAY'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Harian (Mobile)</span>
          </button>
          <button
            onClick={() => setViewMode('MATRIX')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'MATRIX'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Matriks Mingguan</span>
          </button>
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <span className="text-stone-400 text-[11px] font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {(['ALL', 'SM', 'PIC', 'STAFF'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                roleFilter === r
                  ? 'bg-stone-200 text-stone-900 font-semibold'
                  : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 border border-stone-700/60'
              }`}
            >
              {r === 'ALL' ? 'Semua (13)' : r}
            </button>
          ))}
        </div>
      </div>

      {/* DAY-BY-DAY VIEW (Optimized for Mobile) */}
      {viewMode === 'DAY' && (
        <div className="space-y-4">
          {/* Day Pills Bar (Swipeable on small screens) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDates.map((dateStr, idx) => {
              const d = new Date(dateStr);
              const isSelected = idx === selectedDayIdx;
              const isOk = dayStatusCheck(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center relative ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/30 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-stone-900/60 hover:bg-stone-800/80 border-stone-800 text-stone-300'
                  }`}
                >
                  <span className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                    {dayShortLabels[idx]}
                  </span>
                  <span
                    className={`text-sm sm:text-base font-bold my-0.5 ${
                      isSelected ? 'text-amber-400' : 'text-stone-200'
                    }`}
                  >
                    {d.getDate()}
                  </span>

                  {/* Indicator Dot (Green if valid, Red if issue) */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isOk ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                    }`}
                    title={isOk ? 'PIC & Staffing OK' : 'Ada peringatan atau kekurangan staf/PIC'}
                  />
                </button>
              );
            })}
          </div>

          {/* Daily Coverage Summary Card */}
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-stone-100">
                  {dayLabels[selectedDayIdx]}, {selectedDate}
                </h3>
              </div>
              <span className="text-xs bg-stone-800 text-stone-300 px-2.5 py-0.5 rounded-full font-medium">
                {dayStats.totalWorking} Staf Bekerja • {dayStats.offStaff.length} OFF
              </span>
            </div>

            {/* PIC Coverage status & Shift breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* PIC Pagi */}
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  dayStats.morningPIC.length > 0
                    ? 'bg-amber-950/20 border-amber-700/40 text-amber-200'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      PIC Pagi (Opening)
                    </span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {dayStats.morningPIC.length > 0
                        ? dayStats.morningPIC.map((p) => p.name).join(', ')
                        : '⚠️ KOSONG! (Wajib Ada PIC)'}
                    </span>
                  </div>
                </div>
                {dayStats.morningPIC.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>

              {/* PIC Closing */}
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  dayStats.closingPIC.length > 0
                    ? 'bg-purple-950/20 border-purple-700/40 text-purple-200'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      PIC Closing (Malam)
                    </span>
                    <span className="font-semibold text-xs sm:text-sm">
                      {dayStats.closingPIC.length > 0
                        ? dayStats.closingPIC.map((p) => p.name).join(', ')
                        : '⚠️ KOSONG! (Wajib Ada PIC)'}
                    </span>
                  </div>
                </div>
                {dayStats.closingPIC.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
            </div>

            {/* Shift staffing badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-stone-800/80 text-[11px]">
              <span className="text-stone-400 font-medium">Kebutuhan Staff:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                Pagi: {dayStats.morningStaff.length} orang (min 3)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/30 font-medium">
                Middle: {dayStats.middleStaff.length} orang (min 2)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30 font-medium">
                Closing: {dayStats.closingStaff.length} orang (min 3)
              </span>
            </div>
          </div>

          {/* List of Employees with shift for the selected day */}
          <div className="space-y-2.5">
            {activeEmployees.map((emp) => {
              const a = assignmentMap.get(`${selectedDate}_${emp.id}`);
              const shift = a?.shiftCode || 'OFF';
              const isLocked = a?.isLocked || false;
              const badge = getShiftBadge(shift);
              const BadgeIcon = badge.icon;
              const offDaysTotal = getEmployeeOffCount(emp.id);
              const approvedReason = approvedOffMap.get(`${selectedDate}_${emp.id}`);

              return (
                <div
                  key={emp.id}
                  className="bg-stone-900/80 hover:bg-stone-900 border border-stone-800/90 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-sm transition hover:border-stone-700"
                >
                  {/* Left: Avatar, Name & Role */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow"
                      style={{ backgroundColor: emp.avatarColor }}
                    >
                      {emp.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-stone-100 text-xs sm:text-sm truncate">
                          {emp.name}
                        </span>

                        {/* Role Badge */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            emp.jobRole === 'SM'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : emp.jobRole === 'PIC'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-stone-700 text-stone-300'
                          }`}
                        >
                          {emp.jobRole}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                        <span>{emp.employeeCode}</span>
                        <span>•</span>
                        <span
                          className={
                            offDaysTotal === 2
                              ? 'text-emerald-400 font-medium'
                              : 'text-amber-400 font-medium'
                          }
                        >
                          {offDaysTotal}/2 Hari OFF
                        </span>
                        {approvedReason && (
                          <span className="text-purple-400 font-medium text-[10px] bg-purple-950 px-1.5 py-0.5 rounded">
                            Cuti Disetujui
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Shift Selector Button & Lock Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Shift Pill Button (Click to change) */}
                    <button
                      onClick={() =>
                        setEditingAssignment({
                          employee: emp,
                          date: selectedDate,
                          currentShift: shift,
                          isLocked,
                        })
                      }
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 ${badge.className}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <div className="text-left">
                        <div className="leading-tight">{badge.label}</div>
                        <div className="text-[9px] opacity-75 font-normal hidden sm:block">
                          {badge.time}
                        </div>
                      </div>
                    </button>

                    {/* Lock Toggle Button */}
                    <button
                      onClick={() => toggleLock(emp.id, selectedDate)}
                      className={`p-2 rounded-xl border transition ${
                        isLocked
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-stone-800 text-stone-500 border-stone-700/60 hover:text-stone-300'
                      }`}
                      title={isLocked ? 'Assignment Terkunci (Tidak akan diubah otomatis oleh generator)' : 'Buka Kunci'}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MATRIX VIEW (Full 7-day grid with horizontal scroll) */}
      {viewMode === 'MATRIX' && (
        <div className="bg-stone-900/90 rounded-2xl border border-stone-800 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-stone-800/80 border-b border-stone-700 text-stone-300">
                  <th className="p-3 sticky left-0 bg-stone-800 z-10 w-48 shadow-sm">
                    Karyawan ({activeEmployees.length})
                  </th>
                  {weekDates.map((dStr, idx) => {
                    const dt = new Date(dStr);
                    return (
                      <th key={dStr} className="p-2.5 text-center min-w-[110px]">
                        <div className="font-semibold text-stone-200">
                          {dayShortLabels[idx]} {dt.getDate()}
                        </div>
                        <div className="text-[10px] text-stone-400 font-normal">
                          {dayStatusCheck(dStr) ? '● OK' : '⚠️ Isu'}
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-2.5 text-center w-20">OFF Seminggu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {activeEmployees.map((emp) => {
                  const offDaysTotal = getEmployeeOffCount(emp.id);

                  return (
                    <tr key={emp.id} className="hover:bg-stone-800/40 transition">
                      {/* Sticky Employee Column */}
                      <td className="p-2.5 sticky left-0 bg-stone-900 z-10 border-r border-stone-800 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                            style={{ backgroundColor: emp.avatarColor }}
                          >
                            {emp.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-200 truncate">{emp.name}</div>
                            <span
                              className={`text-[9px] font-bold px-1 rounded ${
                                emp.jobRole === 'SM'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : emp.jobRole === 'PIC'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'text-stone-400'
                              }`}
                            >
                              {emp.jobRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 7 Day Shift Cells */}
                      {weekDates.map((dateStr) => {
                        const a = assignmentMap.get(`${dateStr}_${emp.id}`);
                        const shift = a?.shiftCode || 'OFF';
                        const isLocked = a?.isLocked || false;
                        const badge = getShiftBadge(shift);

                        return (
                          <td key={dateStr} className="p-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() =>
                                  setEditingAssignment({
                                    employee: emp,
                                    date: dateStr,
                                    currentShift: shift,
                                    isLocked,
                                  })
                                }
                                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition active:scale-95 flex items-center gap-1 ${badge.className}`}
                              >
                                <span>{badge.label}</span>
                                {isLocked && <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {/* Weekly OFF summary */}
                      <td className="p-2 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            offDaysTotal === 2
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {offDaysTotal} / 2
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK ASSIGNMENT EDIT MODAL (Touch-friendly for mobile) */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h4 className="font-bold text-base text-stone-100">
                  {editingAssignment.employee.name}
                </h4>
                <p className="text-xs text-stone-400">
                  {editingAssignment.date} • Role: {editingAssignment.employee.jobRole}
                </p>
              </div>
              <button
                onClick={() => setEditingAssignment(null)}
                className="text-stone-400 hover:text-stone-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Shift Options */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
                Pilih Shift:
              </label>

              {(['MORNING', 'MIDDLE', 'CLOSING', 'OFF'] as const).map((code) => {
                const b = getShiftBadge(code);
                const isCurrent = editingAssignment.currentShift === code;

                return (
                  <button
                    key={code}
                    onClick={() => {
                      updateAssignment(
                        editingAssignment.employee.id,
                        editingAssignment.date,
                        code,
                        editingAssignment.isLocked
                      );
                      setEditingAssignment({
                        ...editingAssignment,
                        currentShift: code,
                      });
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition active:scale-98 ${
                      isCurrent
                        ? `${b.className} ring-2 ring-amber-500 font-bold`
                        : 'bg-stone-800/80 hover:bg-stone-800 border-stone-700/80 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <b.icon className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-xs font-semibold">{b.label}</div>
                        <div className="text-[10px] text-stone-400">{b.time}</div>
                      </div>
                    </div>
                    {isCurrent && <CheckCircle className="w-4 h-4 text-amber-500" />}
                  </button>
                );
              })}
            </div>

            {/* Lock Assignment Toggle */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium">Kunci Assignment (Lock)</span>
              </div>
              <button
                onClick={() => {
                  const newLocked = !editingAssignment.isLocked;
                  updateAssignment(
                    editingAssignment.employee.id,
                    editingAssignment.date,
                    editingAssignment.currentShift,
                    newLocked
                  );
                  setEditingAssignment({
                    ...editingAssignment,
                    isLocked: newLocked,
                  });
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                  editingAssignment.isLocked
                    ? 'bg-amber-500 text-stone-950 border-amber-400'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                {editingAssignment.isLocked ? 'Terkunci 🔒' : 'Bebas 🔓'}
              </button>
            </div>

            <button
              onClick={() => setEditingAssignment(null)}
              className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-semibold text-stone-200 transition"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
