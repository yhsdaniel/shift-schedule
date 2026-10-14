'use client';

import React, { useRef, useState } from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import { toPng } from 'html-to-image';
import {
  Download,
  Share2,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ShiftCode } from '@/types/scheduler';

interface ExportPngModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportPngModal({ isOpen, onClose }: ExportPngModalProps) {
  const {
    currentStore,
    employees,
    currentSchedule,
    weekDates,
  } = useScheduler();

  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const dayShortLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const activeEmployees = employees.filter(
    (e) => e.storeId === currentStore.id && e.isActive
  );

  // Assignment map
  const assignmentMap = new Map<string, ShiftCode | 'OFF'>();
  if (currentSchedule?.assignments) {
    for (const a of currentSchedule.assignments) {
      assignmentMap.set(`${a.workDate}_${a.employeeId}`, a.shiftCode);
    }
  }

  const handleDownloadImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        quality: 0.95,
        pixelRatio: 2, // High resolution for mobile clarity
      });

      const link = document.createElement('a');
      link.download = `Jadwal_${currentStore.code}_${currentSchedule?.weekStart}_v${currentSchedule?.version || 1}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getShiftBadgeStyle = (shift: ShiftCode | 'OFF') => {
    switch (shift) {
      case 'MORNING':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fde68a',
          label: 'Pagi',
          hours: '07:00-15:00',
        };
      case 'MIDDLE':
        return {
          bg: '#e0f2fe',
          color: '#075985',
          border: '#bae6fd',
          label: 'Mid',
          hours: '11:00-19:00',
        };
      case 'CLOSING':
        return {
          bg: '#f3e8ff',
          color: '#6b21a8',
          border: '#e9d5ff',
          label: 'Close',
          hours: '15:00-23:00',
        };
      case 'OFF':
      default:
        return {
          bg: '#f3f4f6',
          color: '#4b5563',
          border: '#e5e7eb',
          label: 'OFF',
          hours: 'Libur',
        };
    }
  };

  const isDraft = currentSchedule?.status === 'DRAFT';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl text-stone-100 max-h-[95vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Export Jadwal Mingguan (PNG Mobile-Optimized)
              </h3>
              <p className="text-xs text-stone-400">
                Format standar yang siap dibagikan ke grup WhatsApp staf toko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 text-lg p-1 transition"
          >
            ✕
          </button>
        </div>

        {/* Warning if Draft */}
        {isDraft && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Perhatian: Jadwal ini masih berstatus <strong>DRAFT</strong>. Disarankan untuk mempublikasikan (Publish) terlebih dahulu agar menjadi jadwal resmi.
            </span>
          </div>
        )}

        {/* Preview Container (Scrollable) */}
        <div className="flex-1 overflow-auto my-3 bg-stone-950/80 p-3 rounded-2xl border border-stone-800 flex justify-center">
          {/* THE EXPORTABLE CARD (Clean Light Mode Aesthetic for WhatsApp Readability) */}
          <div
            ref={exportRef}
            className="bg-white text-stone-900 rounded-2xl p-5 shadow-lg border border-stone-200 w-[680px] shrink-0 font-sans"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* Header: Store branding & Schedule metadata */}
            <div className="flex items-start justify-between border-b-2 border-stone-800 pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-stone-900 text-white font-extrabold text-xs px-2.5 py-1 rounded-md tracking-wider">
                    {currentStore.code}
                  </span>
                  <h1 className="text-lg font-black tracking-tight text-stone-900">
                    {currentStore.name}
                  </h1>
                </div>
                <p className="text-xs text-stone-600 mt-1 flex items-center gap-2">
                  <span>📅 Periode: <strong>{currentSchedule?.weekStart} s/d {currentSchedule?.weekEnd}</strong></span>
                  <span>•</span>
                  <span>Rest Min: {currentStore.minimumRestHours} Jam</span>
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isDraft
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {currentSchedule?.status} v{currentSchedule?.version}
                </span>
                <p className="text-[10px] text-stone-500 mt-1">
                  Update: {currentSchedule?.updatedAt || new Date().toLocaleString('sv-SE')}
                </p>
              </div>
            </div>

            {/* Matrix Table of all 13 Employees */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 border-y border-stone-300 text-stone-700">
                  <th className="py-1.5 px-2 text-left font-bold w-36">Karyawan (13)</th>
                  <th className="py-1.5 px-1 text-center font-bold w-12">Role</th>
                  {weekDates.map((dStr, idx) => {
                    const dt = new Date(dStr);
                    return (
                      <th key={dStr} className="py-1.5 px-1 text-center font-bold">
                        <div>{dayShortLabels[idx]}</div>
                        <div className="text-[10px] font-normal text-stone-500">{dt.getDate()}</div>
                      </th>
                    );
                  })}
                  <th className="py-1.5 px-1 text-center font-bold w-12">OFF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {activeEmployees.map((emp, index) => {
                  let empOff = 0;
                  return (
                    <tr
                      key={emp.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-stone-50/70'}
                    >
                      {/* Name */}
                      <td className="py-1.5 px-2 font-medium text-stone-900 truncate">
                        {emp.name}
                      </td>

                      {/* Role badge */}
                      <td className="py-1.5 px-1 text-center">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            emp.jobRole === 'SM'
                              ? 'bg-amber-100 text-amber-800 font-extrabold'
                              : emp.jobRole === 'PIC'
                              ? 'bg-blue-100 text-blue-800 font-extrabold'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {emp.jobRole}
                        </span>
                      </td>

                      {/* 7 Day shifts */}
                      {weekDates.map((dateStr) => {
                        const shift = assignmentMap.get(`${dateStr}_${emp.id}`) || 'OFF';
                        if (shift === 'OFF') empOff++;
                        const badge = getShiftBadgeStyle(shift);

                        return (
                          <td key={dateStr} className="py-1 px-1 text-center">
                            <span
                              className="inline-block w-full py-1 rounded text-[10px] font-bold border"
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.color,
                                borderColor: badge.border,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                        );
                      })}

                      {/* Weekly off */}
                      <td className="py-1.5 px-1 text-center font-bold text-stone-800 text-[11px]">
                        {empOff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer: Color Legend & Notice */}
            <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-600">
              <div className="flex items-center gap-3">
                <span className="font-bold text-stone-700">Legenda:</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-200 border border-amber-400" />
                  <strong>Pagi</strong> 07:00-15:00
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-sky-200 border border-sky-400" />
                  <strong>Mid</strong> 11:00-19:00
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-200 border border-purple-400" />
                  <strong>Close</strong> 15:00-23:00
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-stone-200 border border-stone-300" />
                  <strong>OFF</strong> Libur (2x/minggu)
                </span>
              </div>
              <div className="font-semibold text-stone-500">
                FnB Store Shift Scheduler
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-400">
            {downloadSuccess ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Gambar PNG berhasil diunduh!
              </span>
            ) : (
              <span>Gambar beresolusi tinggi, siap dibagikan ke smartphone.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-semibold text-stone-200 transition"
            >
              Tutup
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-xs shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat PNG...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Gambar PNG</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
