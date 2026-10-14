'use client';

import React from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ValidationModal({ isOpen, onClose }: ValidationModalProps) {
  const { validationResult, currentStore } = useScheduler();

  if (!isOpen) return null;

  // PRD 7.1 Hard Constraints
  const constraints = [
    {
      id: 'HC-01',
      title: 'HC-01: Tepat 2 Hari OFF',
      desc: 'Setiap karyawan aktif untuk minggu penuh memperoleh tepat 2 hari tanpa assignment kerja.',
      status: !validationResult.errors.some((e) => e.code === 'WEEKLY_OFF_VIOLATION'),
    },
    {
      id: 'HC-02',
      title: 'HC-02: Approved Request Off Dihormati',
      desc: 'Karyawan tidak boleh dijadwalkan pada tanggal yang tercakup approved request off.',
      status: !validationResult.errors.some((e) => e.code === 'APPROVED_OFF_VIOLATION'),
    },
    {
      id: 'HC-03',
      title: 'HC-03: Tidak Ada Assignment Overlap',
      desc: 'Tidak boleh ada dua assignment yang bertabrakan untuk karyawan yang sama pada hari yang sama.',
      status: !validationResult.errors.some((e) => e.code === 'OVERLAP_VIOLATION'),
    },
    {
      id: 'HC-04',
      title: 'HC-04: PIC Coverage Lengkap',
      desc: 'Setiap hari wajib memiliki minimal 1 PIC di shift Pagi dan minimal 1 PIC di shift Closing (SM dihitung sebagai PIC).',
      status: !validationResult.errors.some(
        (e) => e.code === 'NO_PIC_MORNING' || e.code === 'NO_PIC_CLOSING'
      ),
    },
    {
      id: 'HC-05',
      title: `HC-05: Rest Interval >= ${currentStore.minimumRestHours} Jam`,
      desc: 'Interval istirahat antar-shift berturut-turut harus memenuhi batas minimum toko (mencegah anti-jumping Closing ke Pagi).',
      status: !validationResult.errors.some((e) => e.code === 'REST_INTERVAL_VIOLATION'),
    },
    {
      id: 'HC-06',
      title: 'HC-06: Kuota Staffing Terpenuhi',
      desc: 'Jumlah staff per shift berada di antara batas minimum dan maksimum yang dikonfigurasi.',
      status: !validationResult.errors.some((e) => e.code === 'STAFFING_UNDER_MIN'),
    },
    {
      id: 'HC-07',
      title: 'HC-07: Eligibility Karyawan Terpenuhi',
      desc: 'Karyawan harus eligible untuk shift yang ditugaskan.',
      status: true,
    },
    {
      id: 'HC-08',
      title: 'HC-08: Assignment Terkunci Dihormati',
      desc: 'Assignment yang dikunci tidak boleh diubah otomatis dan tidak menimbulkan konflik lock.',
      status: !validationResult.errors.some((e) => e.code === 'LOCKED_CONFLICT'),
    },
    {
      id: 'HC-09',
      title: 'HC-09: Kelayakan Publikasi (Publish Gate)',
      desc: 'Hanya jadwal yang lolos seluruh hard constraints di atas yang diizinkan untuk dipublikasikan.',
      status: validationResult.isValid,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl text-stone-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            {validationResult.isValid ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            )}
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Audit Validasi Aturan (PRD HC-01 s/d HC-09)
              </h3>
              <p className="text-xs text-stone-400">
                Pemeriksaan kepatuhan aturan operasional jadwal mingguan
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

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
          {/* Status summary banner */}
          <div
            className={`p-3 rounded-2xl border flex items-center gap-3 ${
              validationResult.isValid
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800 text-rose-200'
            }`}
          >
            {validationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-bold">
                {validationResult.isValid
                  ? 'Jadwal Memenuhi Seluruh Hard Constraints!'
                  : `Ditemukan ${validationResult.errors.length} Pelanggaran yang Memblokir Publikasi:`}
              </span>
              <p className="text-[11px] opacity-90 mt-0.5">
                {validationResult.isValid
                  ? 'Jadwal ini siap dipublikasikan atau diekspor ke staf toko.'
                  : 'Sistem menolak publikasi hingga seluruh pelanggaran di bawah diperbaiki.'}
              </p>
            </div>
          </div>

          {/* Detailed errors if any */}
          {validationResult.errors.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                Daftar Pelanggaran Aktif:
              </span>
              {validationResult.errors.map((err) => (
                <div
                  key={err.id}
                  className="bg-stone-950/60 p-3 rounded-xl border border-rose-500/30 text-rose-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      {err.code}
                    </span>
                    {err.date && (
                      <span className="text-[10px] text-stone-400">Tgl: {err.date}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-rose-200">{err.message}</p>
                  {err.recommendation && (
                    <p className="text-[11px] text-stone-400 mt-1">
                      💡 Saran: {err.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hard Constraints Matrix Checklist */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Daftar Ketentuan Hard Constraints:
            </span>
            <div className="space-y-1.5">
              {constraints.map((c) => (
                <div
                  key={c.id}
                  className="bg-stone-800/40 p-2.5 rounded-xl border border-stone-800 flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <span>{c.title}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">{c.desc}</p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {c.status ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3" /> Lolos
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/60">
                        <XCircle className="w-3 h-3" /> Gagal
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-semibold text-stone-200 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
