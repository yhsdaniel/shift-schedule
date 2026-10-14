'use client';

import React, { useState } from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp, ArrowRight, ShieldCheck } from 'lucide-react';

interface ConflictBannerProps {
  onOpenValidation: () => void;
}

export function ConflictBanner({ onOpenValidation }: ConflictBannerProps) {
  const { validationResult, timeOffRequests, currentStore } = useScheduler();
  const [isExpanded, setIsExpanded] = useState(false);

  const pendingRequests = timeOffRequests.filter(
    (r) => r.storeId === currentStore.id && r.status === 'PENDING'
  );

  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0 || pendingRequests.length > 0;

  if (!hasErrors && !hasWarnings) {
    return null;
  }

  return (
    <div
      className={`mx-3 sm:mx-6 my-3 rounded-2xl border transition-all ${
        hasErrors
          ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
          : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
      }`}
    >
      <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {hasErrors ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          )}

          <div>
            <div className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span>
                {hasErrors
                  ? `Ditemukan ${validationResult.errors.length} Pelanggaran Aturan (Hard Constraints)`
                  : `Peringatan: Ada ${validationResult.warnings.length + pendingRequests.length} Item Perhatian`}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs opacity-90 line-clamp-1">
              {hasErrors
                ? validationResult.errors[0]?.message
                : pendingRequests.length > 0
                ? `${pendingRequests.length} permohonan off masih Pending.`
                : validationResult.warnings[0]?.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenValidation}
            className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition active:scale-95"
          >
            <span>Periksa Isu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-xs transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded list of issues */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-white/10 pt-3 text-xs space-y-2">
          {validationResult.errors.map((err) => (
            <div
              key={err.id}
              className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-rose-500/20"
            >
              <span className="font-bold text-rose-400 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20">
                Wajib Diperbaiki
              </span>
              <div className="flex-1">
                <p className="font-medium text-rose-100">{err.message}</p>
                {err.recommendation && (
                  <p className="text-[11px] text-rose-300/80 mt-0.5">Saran: {err.recommendation}</p>
                )}
              </div>
            </div>
          ))}

          {validationResult.warnings.map((warn) => (
            <div
              key={warn.id}
              className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-amber-500/20"
            >
              <span className="font-bold text-amber-400 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20">
                Perhatian
              </span>
              <div className="flex-1">
                <p className="font-medium text-amber-100">{warn.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
