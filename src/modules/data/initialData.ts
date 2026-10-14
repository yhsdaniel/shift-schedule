import { Store, Employee, ShiftTemplate, ShiftRequirement, TimeOffRequest, Schedule, AuditLog } from '@/types/scheduler';

export const INITIAL_STORES: Store[] = [
  {
    id: 'store_senopati',
    name: 'Senopati Specialty Cafe',
    code: 'SNP-01',
    timezone: 'Asia/Jakarta (WIB)',
    minimumRestHours: 11,
    status: 'ACTIVE',
    address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
  },
  {
    id: 'store_kemang',
    name: 'Kemang Brunch & Bakery',
    code: 'KMG-02',
    timezone: 'Asia/Jakarta (WIB)',
    minimumRestHours: 11,
    status: 'ACTIVE',
    address: 'Jl. Kemang Raya No. 18, Mampang Prapatan, Jakarta Selatan',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  // 1 Store Manager (also counts as PIC)
  {
    id: 'emp_01',
    storeId: 'store_senopati',
    employeeCode: 'EMP-001',
    name: 'Budi Santoso',
    jobRole: 'SM',
    isActive: true,
    avatarColor: '#d97706', // amber
    phone: '0812-3456-7890',
  },
  // 2 PICs
  {
    id: 'emp_02',
    storeId: 'store_senopati',
    employeeCode: 'EMP-002',
    name: 'Rian Pratama',
    jobRole: 'PIC',
    isActive: true,
    avatarColor: '#2563eb', // blue
    phone: '0813-4567-8901',
  },
  {
    id: 'emp_03',
    storeId: 'store_senopati',
    employeeCode: 'EMP-003',
    name: 'Siti Rahma',
    jobRole: 'PIC',
    isActive: true,
    avatarColor: '#7c3aed', // violet
    phone: '0814-5678-9012',
  },
  // 10 Staff
  {
    id: 'emp_04',
    storeId: 'store_senopati',
    employeeCode: 'EMP-004',
    name: 'Dimas Anggara',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#059669', // emerald
    phone: '0815-6789-0123',
  },
  {
    id: 'emp_05',
    storeId: 'store_senopati',
    employeeCode: 'EMP-005',
    name: 'Aditya Permana',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#0d9488', // teal
    phone: '0816-7890-1234',
  },
  {
    id: 'emp_06',
    storeId: 'store_senopati',
    employeeCode: 'EMP-006',
    name: 'Nadia Safitri',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#db2777', // pink
    phone: '0817-8901-2345',
  },
  {
    id: 'emp_07',
    storeId: 'store_senopati',
    employeeCode: 'EMP-007',
    name: 'Fajar Nugraha',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#4f46e5', // indigo
    phone: '0818-9012-3456',
  },
  {
    id: 'emp_08',
    storeId: 'store_senopati',
    employeeCode: 'EMP-008',
    name: 'Dewi Lestari',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#ea580c', // orange
    phone: '0819-0123-4567',
  },
  {
    id: 'emp_09',
    storeId: 'store_senopati',
    employeeCode: 'EMP-009',
    name: 'Bayu Wicaksono',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#0891b2', // cyan
    phone: '0821-1234-5678',
  },
  {
    id: 'emp_10',
    storeId: 'store_senopati',
    employeeCode: 'EMP-010',
    name: 'Maya Indah',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#c026d3', // fuchsia
    phone: '0822-2345-6789',
  },
  {
    id: 'emp_11',
    storeId: 'store_senopati',
    employeeCode: 'EMP-011',
    name: 'Gilang Ramadhan',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#475569', // slate
    phone: '0823-3456-7890',
  },
  {
    id: 'emp_12',
    storeId: 'store_senopati',
    employeeCode: 'EMP-012',
    name: 'Putri Ayu',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#e11d48', // rose
    phone: '0824-4567-8901',
  },
  {
    id: 'emp_13',
    storeId: 'store_senopati',
    employeeCode: 'EMP-013',
    name: 'Kevin Sanjaya',
    jobRole: 'STAFF',
    isActive: true,
    avatarColor: '#65a30d', // lime
    phone: '0825-5678-9012',
  },
];

export const INITIAL_SHIFTS: ShiftTemplate[] = [
  {
    id: 'shift_morning',
    storeId: 'store_senopati',
    code: 'MORNING',
    name: 'Pagi (Opening)',
    startTime: '07:00',
    endTime: '15:00',
    isOvernight: false,
    eligibleRoles: ['SM', 'PIC', 'STAFF'],
    color: {
      bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-400/50',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    },
  },
  {
    id: 'shift_middle',
    storeId: 'store_senopati',
    code: 'MIDDLE',
    name: 'Middle (Peak)',
    startTime: '11:00',
    endTime: '19:00',
    isOvernight: false,
    eligibleRoles: ['SM', 'PIC', 'STAFF'],
    color: {
      bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-400/50',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
    },
  },
  {
    id: 'shift_closing',
    storeId: 'store_senopati',
    code: 'CLOSING',
    name: 'Closing (Malam)',
    startTime: '15:00',
    endTime: '23:00',
    isOvernight: false,
    eligibleRoles: ['SM', 'PIC', 'STAFF'],
    color: {
      bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-400/50',
      badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300',
    },
  },
];

export const INITIAL_SHIFT_REQUIREMENTS: ShiftRequirement[] = [
  // Days 1..7 (Senin..Minggu)
  ...[1, 2, 3, 4, 5, 6, 7].flatMap((day) => [
    {
      id: `req_${day}_m`,
      storeId: 'store_senopati',
      dayOfWeek: day,
      shiftCode: 'MORNING' as const,
      minStaff: 3,
      maxStaff: 5,
    },
    {
      id: `req_${day}_mid`,
      storeId: 'store_senopati',
      dayOfWeek: day,
      shiftCode: 'MIDDLE' as const,
      minStaff: 2,
      maxStaff: 4,
    },
    {
      id: `req_${day}_c`,
      storeId: 'store_senopati',
      dayOfWeek: day,
      shiftCode: 'CLOSING' as const,
      minStaff: 3,
      maxStaff: 5,
    },
  ]),
];

// Helper to get current week Monday
export function getMondayOfCurrentWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const INITIAL_TIME_OFF: TimeOffRequest[] = [
  {
    id: 'to_01',
    employeeId: 'emp_12', // Putri Ayu
    storeId: 'store_senopati',
    startDate: '2026-10-22', // Kamis
    endDate: '2026-10-23',   // Jumat
    status: 'APPROVED',
    reason: 'Urusan keluarga di Bandung',
    approvedBy: 'Budi Santoso (SM)',
    approvedAt: '2026-10-14 09:30',
    createdAt: '2026-10-13 14:00',
  },
  {
    id: 'to_02',
    employeeId: 'emp_04', // Dimas Anggara
    storeId: 'store_senopati',
    startDate: '2026-10-24', // Sabtu
    endDate: '2026-10-24',
    status: 'PENDING',
    reason: 'Keperluan mendesak sertifikasi barista',
    createdAt: '2026-10-14 11:20',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    storeId: 'store_senopati',
    actorName: 'System',
    action: 'INITIALIZE',
    details: 'Inisialisasi konfigurasi toko Senopati dengan 13 staf aktif.',
    timestamp: '2026-10-14 08:00:00',
  },
  {
    id: 'log_02',
    storeId: 'store_senopati',
    actorName: 'Budi Santoso (SM)',
    action: 'APPROVE_TIME_OFF',
    details: 'Menyetujui cuti/off Putri Ayu (22-23 Okt 2026).',
    timestamp: '2026-10-14 09:30:15',
  },
];
