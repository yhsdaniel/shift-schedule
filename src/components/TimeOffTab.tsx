'use client';

import React, { useState } from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import {
  CalendarDays,
  Plus,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Coffee,
} from 'lucide-react';
import { TimeOffRequest, TimeOffStatus } from '@/types/scheduler';

export function TimeOffTab() {
  const {
    timeOffRequests,
    employees,
    currentStore,
    approveTimeOffAction,
    rejectTimeOffAction,
    addTimeOffAction,
  } = useScheduler();

  const [filterStatus, setFilterStatus] = useState<'ALL' | TimeOffStatus>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [startDate, setStartDate] = useState('2026-10-24');
  const [endDate, setEndDate] = useState('2026-10-24');
  const [reason, setReason] = useState('');

  const storeRequests = timeOffRequests.filter((r) => r.storeId === currentStore.id);
  const filteredRequests = storeRequests.filter(
    (r) => filterStatus === 'ALL' || r.status === filterStatus
  );

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !startDate || !endDate || !reason) return;

    addTimeOffAction({
      employeeId: selectedEmpId,
      startDate,
      endDate,
      reason,
    });

    setReason('');
    setIsAddOpen(false);
  };

  const getStatusBadge = (status: TimeOffStatus) => {
    switch (status) {
      case 'APPROVED':
        return {
          label: 'Disetujui',
          className: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
        };
      case 'PENDING':
        return {
          label: 'Menunggu Persetujuan',
          className: 'bg-amber-950 text-amber-400 border border-amber-800',
        };
      case 'REJECTED':
        return {
          label: 'Ditolak',
          className: 'bg-rose-950 text-rose-400 border border-rose-800',
        };
      case 'CANCELLED':
      default:
        return {
          label: 'Dibatalkan',
          className: 'bg-stone-800 text-stone-400 border border-stone-700',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/60 p-3 sm:p-4 rounded-2xl border border-stone-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-500" />
            <span>Manajemen Permohonan Cuti / Request Off</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Hanya status <strong>APPROVED</strong> yang menjadi hard constraint wajib pada generator jadwal (PRD HC-02).
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-stone-950 transition shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Off Baru</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              filterStatus === st
                ? 'bg-stone-200 text-stone-900 font-semibold'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            {st === 'ALL'
              ? `Semua (${storeRequests.length})`
              : st === 'PENDING'
              ? `Pending (${storeRequests.filter((r) => r.status === 'PENDING').length})`
              : st === 'APPROVED'
              ? `Disetujui (${storeRequests.filter((r) => r.status === 'APPROVED').length})`
              : `Ditolak (${storeRequests.filter((r) => r.status === 'REJECTED').length})`}
          </button>
        ))}
      </div>

      {/* List of Requests */}
      <div className="space-y-2.5">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-stone-500 bg-stone-900/40 rounded-2xl border border-stone-800 text-xs">
            Tidak ada permohonan cuti pada kategori ini.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const emp = employeeMap.get(req.employeeId);
            const badge = getStatusBadge(req.status);

            return (
              <div
                key={req.id}
                className="bg-stone-900/80 border border-stone-800/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
              >
                {/* Employee and Date */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow mt-0.5"
                    style={{ backgroundColor: emp?.avatarColor || '#6b7280' }}
                  >
                    {emp?.name.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'EM'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-100 text-xs sm:text-sm">
                        {emp?.name || 'Karyawan'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {emp?.employeeCode}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 mt-1">
                      📅 <strong>{req.startDate}</strong> {req.startDate !== req.endDate ? `s/d ${req.endDate}` : ''}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Alasan: &quot;{req.reason}&quot;
                    </p>

                    {req.approvedBy && (
                      <p className="text-[10px] text-stone-500 mt-1">
                        Disetujui oleh {req.approvedBy} pada {req.approvedAt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions for Pending */}
                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => approveTimeOffAction(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui (Approve)</span>
                    </button>
                    <button
                      onClick={() => rejectTimeOffAction(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-400 border border-rose-900/40 font-semibold text-xs transition active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Time Off Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateRequest}
            className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl text-stone-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-base sm:text-lg">Ajukan Permohonan Cuti / Off</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-stone-400 hover:text-stone-200 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-300 block mb-1">Pilih Karyawan:</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2.5 text-stone-200 text-xs focus:ring-1 focus:ring-amber-500"
                >
                  {employees
                    .filter((e) => e.storeId === currentStore.id && e.isActive)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.jobRole} - {emp.employeeCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-300 block mb-1">Tanggal Mulai:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2 text-stone-200 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-300 block mb-1">Tanggal Selesai:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2 text-stone-200 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-300 block mb-1">Alasan Permohonan:</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Keperluan keluarga mendesak / Ujian sertifikasi..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2.5 text-stone-200 text-xs h-20"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-semibold text-stone-200 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs shadow-md transition"
              >
                Simpan Permohonan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
