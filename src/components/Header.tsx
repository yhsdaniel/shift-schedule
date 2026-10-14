'use client';

import React, { useState } from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import {
  Store,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Sparkles,
  Download,
  Send,
  UserCheck,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { addDays } from '@/modules/data/initialData';

interface HeaderProps {
  onOpenGenerate: () => void;
  onOpenValidation: () => void;
  onOpenExport: () => void;
}

export function Header({ onOpenGenerate, onOpenValidation, onOpenExport }: HeaderProps) {
  const {
    stores,
    currentStore,
    setCurrentStoreId,
    currentUserRole,
    setCurrentUserRole,
    weekStart,
    setWeekStart,
    weekDates,
    currentSchedule,
    validationResult,
    publishScheduleAction,
    resetToInitialDemo,
  } = useScheduler();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const handlePublish = () => {
    const res = publishScheduleAction();
    showToast(res.message);
  };

  // Format date range e.g. "19 Okt - 25 Okt 2026"
  const formatDateRange = () => {
    if (!weekDates.length) return '';
    const d1 = new Date(weekDates[0]);
    const d2 = new Date(weekDates[6]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d1.getDate()} ${months[d1.getMonth()]} - ${d2.getDate()} ${months[d2.getMonth()]} ${d2.getFullYear()}`;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur border-b border-stone-800 text-stone-100 shadow-md">
        {/* Top bar: Store switcher, Role badge, & Reset */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-stone-800/80 text-xs">
          {/* Store Switcher */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              aria-label="Pilih Toko"
              value={currentStore.id}
              onChange={(e) => setCurrentStoreId(e.target.value)}
              className="bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1 font-medium text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            <span className="hidden sm:inline-block text-[11px] text-stone-400">
              Rest: {currentStore.minimumRestHours} Jam
            </span>
          </div>

          {/* Role switcher & Demo reset */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-800 p-0.5 rounded-lg border border-stone-700">
              <button
                onClick={() => setCurrentUserRole('SM')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  currentUserRole === 'SM'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Mode Store Manager"
              >
                SM
              </button>
              <button
                onClick={() => setCurrentUserRole('ADMIN')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  currentUserRole === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Mode System Admin"
              >
                Admin
              </button>
            </div>

            <button
              onClick={resetToInitialDemo}
              className="p-1 text-stone-400 hover:text-stone-200 rounded transition"
              title="Reset data demo ke awal"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Header Row: Period, Status Badge, Quick Actions */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Week Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-800/80 rounded-xl p-0.5 border border-stone-700/60 shadow-inner">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 hover:bg-stone-700 rounded-lg text-stone-300 transition"
                title="Minggu Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2.5 py-1 text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-stone-100 min-w-[150px] justify-center">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>{formatDateRange()}</span>
              </div>
              <button
                onClick={handleNextWeek}
                className="p-1.5 hover:bg-stone-700 rounded-lg text-stone-300 transition"
                title="Minggu Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Version & Status Badge */}
            {currentSchedule && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    currentSchedule.status === 'PUBLISHED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                  }`}
                >
                  {currentSchedule.status === 'PUBLISHED' ? '● Published' : '○ Draft'} v{currentSchedule.version}
                </span>

                {/* Validation status pill */}
                <button
                  onClick={onOpenValidation}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border transition ${
                    validationResult.isValid
                      ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700 hover:bg-emerald-900/60'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800 hover:bg-rose-950'
                  }`}
                >
                  {validationResult.isValid ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Valid</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      <span>{validationResult.errors.length} Isu</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <button
              onClick={onOpenGenerate}
              className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 shadow-md shadow-amber-900/30 transition transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Generate</span>
            </button>

            {currentSchedule?.status === 'DRAFT' && (
              <button
                onClick={handlePublish}
                disabled={!validationResult.isValid}
                className={`flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-md active:scale-95 ${
                  validationResult.isValid
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                }`}
                title={
                  validationResult.isValid
                    ? 'Publikasikan jadwal ini'
                    : 'Perbaiki pelanggaran hard constraints sebelum publish'
                }
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Publish</span>
              </button>
            )}

            <button
              onClick={onOpenExport}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 shadow-sm transition"
              title="Ekspor Jadwal sebagai Gambar PNG"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden sm:inline">Export PNG</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 border border-stone-700 text-stone-100 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
