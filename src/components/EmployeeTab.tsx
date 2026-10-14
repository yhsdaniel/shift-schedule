'use client';

import React, { useState } from 'react';
import { useScheduler } from '@/context/SchedulerContext';
import {
  Users,
  Shield,
  Phone,
  Edit2,
  CheckCircle,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { Employee, JobRole } from '@/types/scheduler';

export function EmployeeTab() {
  const { employees, currentStore, updateEmployee, currentSchedule, weekDates } = useScheduler();
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const storeEmployees = employees.filter((e) => e.storeId === currentStore.id);

  const smCount = storeEmployees.filter((e) => e.jobRole === 'SM').length;
  const picCount = storeEmployees.filter((e) => e.jobRole === 'PIC').length;
  const staffCount = storeEmployees.filter((e) => e.jobRole === 'STAFF').length;

  // Off count helper
  const getOffCount = (empId: string) => {
    if (!currentSchedule) return 0;
    let off = 0;
    for (const d of weekDates) {
      const a = currentSchedule.assignments.find(
        (as) => as.employeeId === empId && as.workDate === d
      );
      if (!a || a.shiftCode === 'OFF') off++;
    }
    return off;
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    updateEmployee(editingEmp.id, {
      name: editingEmp.name,
      jobRole: editingEmp.jobRole,
      phone: editingEmp.phone,
      isActive: editingEmp.isActive,
    });
    setEditingEmp(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Header and Store Roster Summary */}
      <div className="bg-stone-900/60 p-3 sm:p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Daftar Karyawan Toko ({storeEmployees.length} Karyawan)</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Konfigurasi standar: 1 Store Manager (SM), 2 PIC lainnya, dan 10 Staff (Total 3 PIC bertugas).
          </p>
        </div>

        {/* Quick Badges Count */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
            SM: {smCount}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold">
            PIC: {picCount}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-stone-800 text-stone-300 border border-stone-700 font-semibold">
            Staff: {staffCount}
          </span>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {storeEmployees.map((emp) => {
          const offDays = getOffCount(emp.id);

          return (
            <div
              key={emp.id}
              className="bg-stone-900/80 hover:bg-stone-900 border border-stone-800/90 rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition shadow-sm hover:border-stone-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow"
                    style={{ backgroundColor: emp.avatarColor }}
                  >
                    {emp.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>

                  <div>
                    <h4 className="font-semibold text-stone-100 text-xs sm:text-sm">
                      {emp.name}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {emp.employeeCode}
                    </span>
                  </div>
                </div>

                {/* Role badge */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    emp.jobRole === 'SM'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : emp.jobRole === 'PIC'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-stone-800 text-stone-300 border border-stone-700'
                  }`}
                >
                  {emp.jobRole}
                </span>
              </div>

              {/* Details & Status */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-stone-500" />
                  <span>{emp.phone || '-'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={
                      offDays === 2
                        ? 'text-emerald-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                    }
                  >
                    {offDays}/2 Hari OFF
                  </span>

                  <button
                    onClick={() => setEditingEmp(emp)}
                    className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200"
                    title="Edit Data Karyawan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-stone-100 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-sm sm:text-base">Edit Data Karyawan</h3>
              <button
                type="button"
                onClick={() => setEditingEmp(null)}
                className="text-stone-400 hover:text-stone-200 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-stone-300 block mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  value={editingEmp.name}
                  onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2.5 text-stone-200"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-stone-300 block mb-1">Jabatan (Role):</label>
                <select
                  value={editingEmp.jobRole}
                  onChange={(e) =>
                    setEditingEmp({
                      ...editingEmp,
                      jobRole: e.target.value as JobRole,
                    })
                  }
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2.5 text-stone-200"
                >
                  <option value="SM">Store Manager (SM - Termasuk PIC)</option>
                  <option value="PIC">Person In Charge (PIC)</option>
                  <option value="STAFF">Crew / Staff</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-300 block mb-1">Nomor WhatsApp:</label>
                <input
                  type="text"
                  value={editingEmp.phone || ''}
                  onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2.5 text-stone-200"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-stone-300">Status Aktif:</span>
                <button
                  type="button"
                  onClick={() => setEditingEmp({ ...editingEmp, isActive: !editingEmp.isActive })}
                  className={`px-3 py-1 rounded-xl font-semibold border ${
                    editingEmp.isActive
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}
                >
                  {editingEmp.isActive ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingEmp(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-xl font-semibold text-stone-300"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl shadow-md"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
