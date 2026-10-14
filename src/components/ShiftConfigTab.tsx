'use client';

import React, { useState } from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import {
  Sliders,
  Clock,
  Users,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ShiftTemplate } from '@/types/scheduler';

export function ShiftConfigTab() {
  const {
    currentStore,
    shifts,
    updateShiftTimes,
    updateStoreSettings,
    requirements,
  } = useScheduler();

  const [localShifts, setLocalShifts] = useState<ShiftTemplate[]>(shifts);
  const [restHours, setRestHours] = useState<number>(currentStore.minimumRestHours);
  const [saveToast, setSaveToast] = useState(false);

  const handleShiftChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const updated = [...localShifts];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setLocalShifts(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateShiftTimes(localShifts);
    updateStoreSettings({ minimumRestHours: restHours });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Header */}
      <div className="bg-stone-900/60 p-3 sm:p-4 rounded-2xl border border-stone-800 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <span>Konfigurasi Shift & Aturan Toko ({currentStore.name})</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Perubahan jam dan rest interval akan langsung diuji pada validasi dan generator jadwal berikutnya.
          </p>
        </div>

        {saveToast && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Rest Interval Rule Section */}
        <div className="bg-stone-900/80 border border-stone-800/90 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-stone-200 text-sm">
                Minimum Rest Interval (Aturan Anti-Jumping)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
              {restHours} Jam
            </span>
          </div>

          <p className="text-xs text-stone-400">
            Jeda istirahat minimum antar-shift berturut-turut. Mencegah staf yang bekerja Closing (selesai 23:00) langsung bertugas di shift Pagi (mulai 07:00) keesokan harinya karena jedanya hanya 8 jam.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min="8"
              max="16"
              step="1"
              value={restHours}
              onChange={(e) => setRestHours(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-stone-300 w-12 text-right">
              {restHours} Jam
            </span>
          </div>
        </div>

        {/* Shift Templates Times */}
        <div className="bg-stone-900/80 border border-stone-800/90 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-stone-200 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Jam Operasional Template Shift</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {localShifts.map((shift, idx) => (
              <div
                key={shift.code}
                className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200">{shift.name}</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                    {shift.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Mulai Kerja:</label>
                    <input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) => handleShiftChange(idx, 'startTime', e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1">Selesai Kerja:</label>
                    <input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) => handleShiftChange(idx, 'endTime', e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-stone-500 pt-1">
                  Eligible: SM, PIC, Staff (8 Jam Kerja)
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Staffing Requirements Overview */}
        <div className="bg-stone-900/80 border border-stone-800/90 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-stone-200 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <span>Kebutuhan Staffing Toko (Senin - Minggu)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="font-bold text-amber-400 block mb-1">Shift Pagi</span>
              <p className="text-stone-300">Min 3 staf • Max 5 staf</p>
              <p className="text-[10px] text-amber-400/80 mt-1 font-semibold">
                ★ Wajib minimal 1 PIC / SM
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <span className="font-bold text-sky-400 block mb-1">Shift Middle</span>
              <p className="text-stone-300">Min 2 staf • Max 4 staf</p>
              <p className="text-[10px] text-stone-400 mt-1">
                Fleksibel untuk cover jam ramai
              </p>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="font-bold text-purple-400 block mb-1">Shift Closing</span>
              <p className="text-stone-300">Min 3 staf • Max 5 staf</p>
              <p className="text-[10px] text-purple-400/80 mt-1 font-semibold">
                ★ Wajib minimal 1 PIC / SM
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs shadow-md transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Konfigurasi</span>
          </button>
        </div>
      </form>
    </div>
  );
}
