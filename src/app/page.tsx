'use client';

import React, { useState } from 'react';
import { SchedulerProvider, useScheduler } from '@/context/SchedulerContext';
import { Header } from '@/components/Header';
import { ConflictBanner } from '@/components/ConflictBanner';
import { WeeklyScheduleView } from '@/components/WeeklyScheduleView';
import { TimeOffTab } from '@/components/TimeOffTab';
import { EmployeeTab } from '@/components/EmployeeTab';
import { ShiftConfigTab } from '@/components/ShiftConfigTab';
import { HistoryAuditTab } from '@/components/HistoryAuditTab';
import { ValidationModal } from '@/components/ValidationModal';
import { ExportPngModal } from '@/components/ExportPngModal';
import { GenerateModal } from '@/components/GenerateModal';
import {
  CalendarDays,
  Users,
  Coffee,
  Sliders,
  History,
  ShieldAlert,
} from 'lucide-react';

type TabKey = 'SCHEDULE' | 'EMPLOYEES' | 'TIMEOFF' | 'SETTINGS' | 'AUDIT';

function SchedulerMainApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('SCHEDULE');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { timeOffRequests, validationResult, currentStore } = useScheduler();

  const pendingOffCount = timeOffRequests.filter(
    (r) => r.storeId === currentStore.id && r.status === 'PENDING'
  ).length;

  const hasErrors = validationResult.errors.length > 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col pb-24 sm:pb-8">
      {/* Top Header */}
      <Header
        onOpenGenerate={() => setIsGenerateOpen(true)}
        onOpenValidation={() => setIsValidationOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Navigation Tabs (Visible on Tablet & Desktop) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 w-full">
        <div className="hidden sm:flex items-center gap-1 bg-stone-900/80 p-1.5 rounded-2xl border border-stone-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'SCHEDULE'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Jadwal Mingguan</span>
            {hasErrors && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'EMPLOYEES'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Karyawan (13 Staf)</span>
          </button>

          <button
            onClick={() => setActiveTab('TIMEOFF')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition relative ${
              activeTab === 'TIMEOFF'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Request Off</span>
            {pendingOffCount > 0 && (
              <span className="bg-amber-500 text-stone-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {pendingOffCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'SETTINGS'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Shift & Aturan Toko</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
              activeTab === 'AUDIT'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histori & Audit</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'SCHEDULE' && (
          <>
            <ConflictBanner onOpenValidation={() => setIsValidationOpen(true)} />
            <WeeklyScheduleView />
          </>
        )}

        {activeTab === 'EMPLOYEES' && <EmployeeTab />}
        {activeTab === 'TIMEOFF' && <TimeOffTab />}
        {activeTab === 'SETTINGS' && <ShiftConfigTab />}
        {activeTab === 'AUDIT' && <HistoryAuditTab />}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Sticky at bottom on small screens) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/90 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition relative ${
              activeTab === 'SCHEDULE' ? 'text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Jadwal</span>
            {hasErrors && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'EMPLOYEES' ? 'text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Staf (13)</span>
          </button>

          <button
            onClick={() => setActiveTab('TIMEOFF')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition relative ${
              activeTab === 'TIMEOFF' ? 'text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            <Coffee className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Cuti/Off</span>
            {pendingOffCount > 0 && (
              <span className="absolute top-1 right-2.5 bg-amber-500 text-stone-950 text-[9px] font-black px-1 rounded-full">
                {pendingOffCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'SETTINGS' ? 'text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Aturan</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'AUDIT' ? 'text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Histori</span>
          </button>
        </div>
      </nav>

      {/* Global Modals */}
      <GenerateModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
      />

      <ValidationModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
      />

      <ExportPngModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <SchedulerProvider>
      <SchedulerMainApp />
    </SchedulerProvider>
  );
}
