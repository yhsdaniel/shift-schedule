'use client';

import React, { useState } from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import {
  Sparkles,
  Lock,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GenerateModal({ isOpen, onClose }: GenerateModalProps) {
  const { generateScheduleAction, currentSchedule, employees, currentStore } = useScheduler();

  const [minimalChange, setMinimalChange] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  // Count locked assignments in current schedule
  const lockedCount = currentSchedule?.assignments.filter((a) => a.isLocked).length || 0;

  const handleRunGenerate = () => {
    setIsGenerating(true);
    setResultMessage(null);

    setTimeout(() => {
      const res = generateScheduleAction({ minimalChange });
      setIsGenerating(false);
      setResultMessage({
        success: res.success,
        text: res.message,
      });

      if (res.success) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }, 400); // slight simulated pause for solver feedback
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-stone-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Generate Jadwal Otomatis
              </h3>
              <p className="text-xs text-stone-400">
                Constraint-based scheduling engine dengan optimasi fairness
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

        {/* Options */}
        <div className="space-y-3 text-xs">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="font-semibold text-stone-300 block">
              Pilih Strategi Penyusunan:
            </label>

            {/* Minimal Change Option */}
            <div
              onClick={() => setMinimalChange(true)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                minimalChange
                  ? 'bg-amber-500/15 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/40'
                  : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Minimal Change Regeneration</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-stone-950 font-extrabold">
                    Rekomendasi
                  </span>
                </span>
                <input
                  type="radio"
                  checked={minimalChange}
                  onChange={() => setMinimalChange(true)}
                  className="accent-amber-500"
                />
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Mempertahankan jadwal yang sudah ada sebanyak mungkin. Hanya mengubah assignment yang melanggar aturan cuti baru, rest interval, atau kekurangan PIC.
              </p>
            </div>

            {/* Fresh Randomization Option */}
            <div
              onClick={() => setMinimalChange(false)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                !minimalChange
                  ? 'bg-amber-500/15 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/40'
                  : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs sm:text-sm">
                  Fresh Generation (Acak Penuh)
                </span>
                <input
                  type="radio"
                  checked={!minimalChange}
                  onChange={() => setMinimalChange(false)}
                  className="accent-amber-500"
                />
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Menyusun ulang seluruh rotasi shift dari nol untuk memaksimalkan variasi dan pemerataan (assignment terkunci tetap dihormati).
              </p>
            </div>
          </div>

          {/* Locked Status Notice */}
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-semibold text-stone-200">
                  {lockedCount} Assignment Terkunci (Locked)
                </span>
                <p className="text-[10px] text-stone-400">
                  Assignment yang dikunci tidak akan diubah otomatis oleh generator.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              Dilindungi
            </span>
          </div>

          {/* Rules Enforced */}
          <div className="p-3 bg-stone-800/30 rounded-xl border border-stone-800/80 space-y-1.5 text-[11px] text-stone-400">
            <div className="font-semibold text-stone-300">
              Aturan Wajib yang Diterapkan Generator:
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Tepat 2 hari OFF per karyawan per minggu.</li>
              <li>PIC wajib hadir di shift Pagi dan Closing setiap hari.</li>
              <li>Jeda istirahat minimum {currentStore.minimumRestHours} jam (anti-jumping).</li>
              <li>Cuti Approved selalu dihormati (otomatis OFF).</li>
            </ul>
          </div>

          {/* Result message */}
          {resultMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                resultMessage.success
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-800 text-rose-200'
              }`}
            >
              {resultMessage.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{resultMessage.text}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-semibold text-stone-200 transition"
          >
            Batal
          </button>
          <button
            onClick={handleRunGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-900/30 transition active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menghitung Solver...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mulai Generate Draft</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
