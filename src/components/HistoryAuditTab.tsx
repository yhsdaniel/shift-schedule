'use client';

import React from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import {
  History,
  RotateCcw,
  ShieldAlert,
  FileText,
  UserCheck,
  CheckCircle,
  Clock,
} from 'lucide-react';

export function HistoryAuditTab() {
  const {
    scheduleHistory,
    currentSchedule,
    restoreVersionAction,
    auditLogs,
    currentStore,
  } = useScheduler();

  const storeAuditLogs = auditLogs.filter((l) => l.storeId === currentStore.id);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Version History Section */}
      <div className="bg-stone-900/60 p-3 sm:p-4 rounded-2xl border border-stone-800 space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <span>Riwayat Versi Jadwal (Schedule Versioning)</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Setiap kali generate ulang atau publikasi, sistem membuat snapshot versi. Anda dapat melihat atau mengembalikan (restore) versi sebelumnya kapan saja.
          </p>
        </div>

        <div className="space-y-2">
          {scheduleHistory.map((s) => {
            const isCurrent = s.id === currentSchedule?.id;

            return (
              <div
                key={s.id}
                className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/50 text-stone-100 ring-1 ring-amber-500/30'
                    : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      s.status === 'PUBLISHED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {s.status === 'PUBLISHED' ? '● Published' : '○ Draft'} v{s.version}
                  </span>

                  <div>
                    <div className="font-semibold text-stone-200">
                      Periode: {s.weekStart} s/d {s.weekEnd}
                    </div>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Dibuat: {s.createdAt} • Terakhir diperbarui: {s.updatedAt}
                      {s.publishedBy && ` • Dipublikasikan oleh ${s.publishedBy}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrent ? (
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/40">
                      Versi Aktif
                    </span>
                  ) : (
                    <button
                      onClick={() => restoreVersionAction(s.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold text-xs transition active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Log Trail Section */}
      <div className="bg-stone-900/60 p-3 sm:p-4 rounded-2xl border border-stone-800 space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>Audit Trail & Log Aktivitas (PRD Section 10 & 13)</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Semua perubahan jadwal, assignment manual, approval cuti, dan publikasi dicatat secara kronologis.
          </p>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {storeAuditLogs.length === 0 ? (
            <p className="text-xs text-stone-500 py-4 text-center">Belum ada log aktivitas tercatat.</p>
          ) : (
            storeAuditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-stone-950/60 p-3 rounded-xl border border-stone-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-stone-800 text-amber-400 border border-stone-700">
                      {log.action}
                    </span>
                    <span className="font-semibold text-stone-200">{log.actorName}</span>
                  </div>
                  <p className="text-stone-300 text-[11px]">{log.details}</p>
                </div>

                <div className="text-[10px] text-stone-500 font-mono shrink-0">
                  {log.timestamp}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
