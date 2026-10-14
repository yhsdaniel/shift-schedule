PRODUCT REQUIREMENTS DOCUMENT

# FnB Store Shift Scheduler

Version 1.1 — Final Business Rules & Technical Specification

Tanggal: 14 Oktober 2026
Status: Draft siap diturunkan ke technical design dan development
Dokumen: PRD / Product & Engineering Specification


| Ringkasan | Keputusan |
| --- | --- |
| Target pengguna | Store Manager di setiap toko FnB; System Admin untuk pengelolaan global. |
| Ukuran toko awal | 13 karyawan per toko, termasuk 1 SM dan total 3 PIC. |
| Model penjadwalan | Constraint-based scheduling dengan randomisasi terkendali. |
| Prioritas optimasi | Operational-first, minimal changes saat regenerate, lalu fairness. |
| Output | Jadwal mingguan yang tervalidasi dan dapat diekspor sebagai PNG. |



# 1. Executive Summary

FnB Store Shift Scheduler adalah aplikasi web multi-toko untuk membantu Store Manager (SM) menyusun jadwal kerja mingguan bagi 13 karyawan per toko. SM dapat mengonfigurasi shift, memasukkan request off, menetapkan assignment manual, menjalankan generator acak yang mengikuti aturan operasional, memvalidasi hasil, memublikasikan jadwal, dan mengekspornya sebagai gambar.

Produk tidak menggunakan randomisasi sederhana. Generator menggunakan constraint-based scheduling: hard constraints wajib dipenuhi, lalu sistem mengoptimalkan operational coverage, meminimalkan perubahan dari jadwal sebelumnya, dan memperbaiki fairness.

## 1.1 Tujuan bisnis

- Mengurangi waktu pembuatan jadwal mingguan.
- Mencegah konflik shift, pelanggaran rest interval, dan kekurangan PIC.
- Mengakomodasi approved request off dan assignment manual.
- Meminimalkan perubahan pada jadwal yang sudah valid ketika generate ulang.
- Menyediakan export PNG yang terbaca di smartphone dan mudah dibagikan.
- Memisahkan akses dan data antar-toko.
## 1.2 Prinsip desain

- Rules before randomization: validitas lebih penting daripada randomisasi.
- Manual control: SM dapat menetapkan dan mengunci assignment.
- Minimal-change regeneration: pertahankan assignment valid sebanyak mungkin.
- Explainable scheduling: konflik harus dijelaskan, bukan sekadar menampilkan error.
- Store isolation: otorisasi diperiksa di backend untuk setiap operasi.
# 2. Keputusan Bisnis Final

| Area | Keputusan final | Interpretasi implementasi |
| --- | --- | --- |
| Jatah off | 2 hari per karyawan per minggu | Hard constraint untuk karyawan aktif yang dijadwalkan selama satu minggu penuh. |
| Minimum rest interval | Custom jam per toko | Nilai konfigurasi tervalidasi; perhitungan berdasarkan timestamp aktual. |
| Store Manager | Ikut randomisasi | SM termasuk salah satu dari 3 PIC dan mengikuti aturan off/rest yang sama. |
| Request off | Hanya Approved menjadi hard constraint | Pending ditampilkan sebagai peringatan; Rejected/Cancelled tidak memblokir jadwal. |
| Staffing | Configurable | Minimum/maksimum dapat berbeda menurut toko, hari, dan shift. |
| Fairness | Operational-first | Coverage minimum dan PIC wajib dipenuhi sebelum optimasi fairness. |
| Generate ulang | Minimal change | Pertahankan assignment valid; perubahan wajib dilakukan bila ada konflik. |


# 3. Scope Produk

## 3.1 Termasuk MVP

- Login, logout, reset/ganti password, dan role-based access.
- Manajemen toko, akun SM, dan daftar karyawan.
- Konfigurasi shift pagi, middle, closing, jam, eligibility, dan staffing.
- Request off dengan status Pending, Approved, Rejected, Cancelled.
- Generate jadwal mingguan berbasis constraints.
- Manual assignment, assignment lock, validasi konflik, dan regenerate minimal-change.
- Draft, publish, version history, audit log, dan export PNG.
## 3.2 Di luar MVP

- Integrasi payroll dan absensi biometrik.
- Pertukaran shift antar-toko.
- Notifikasi WhatsApp otomatis.
- Prediksi kebutuhan tenaga kerja berbasis AI.
- Split shift dan beberapa assignment kerja untuk karyawan yang sama pada satu hari.
- Portal pengajuan off mandiri oleh staff (dapat menjadi fase berikutnya).
# 4. Pengguna dan Hak Akses

| Role | Hak akses |
| --- | --- |
| System Admin | Membuat toko, mengelola akun SM, konfigurasi global, dan mengakses toko sesuai otorisasi. |
| Store Manager | Mengelola karyawan, shift, request off, jadwal, manual lock, publikasi, dan export untuk tokonya. |
| PIC | Atribut jabatan karyawan; dapat dijadwalkan untuk memenuhi PIC coverage. Login PIC bersifat opsional pada MVP. |
| Staff | Menjadi anggota jadwal; tidak memiliki akses manajemen pada MVP kecuali diberi akun/role khusus. |


Security requirement: SM hanya boleh membaca atau mengubah data toko yang ditugaskan kepadanya. Pengecekan harus dilakukan di server/backend, bukan hanya dengan menyembunyikan menu di frontend.

# 5. Struktur Karyawan dan Shift

Setiap toko memiliki 13 karyawan sebagai konfigurasi awal: 1 Store Manager, 2 PIC lainnya, dan 10 staff. SM termasuk dalam total 3 PIC. Jumlah karyawan dapat dibuat configurable untuk mengakomodasi perubahan bisnis, kecuali perusahaan memutuskan jumlah 13 sebagai batas wajib.

## 5.1 Konfigurasi shift

| Field | Contoh / aturan |
| --- | --- |
| shift_code | MORNING, MIDDLE, CLOSING |
| shift_name | Pagi, Middle, Closing |
| start_time / end_time | Jam lokal; harus mendukung shift overnight. |
| min_staff / max_staff | Jumlah minimum dan maksimum per kebutuhan shift. |
| eligible_roles | SM, PIC, Staff; dapat dikonfigurasi. |
| is_active | Menentukan apakah template dapat digunakan untuk jadwal baru. |


Jam shift pada contoh adalah ilustrasi. SM/Admin dapat mengubahnya tanpa deployment ulang. Waktu harus dihitung berdasarkan tanggal dan timezone toko, bukan hanya membandingkan string jam.

# 6. Functional Requirements

## FR-01 — Authentication & Authorization

- Login menggunakan email/username dan password; password disimpan dengan hashing aman.
- Admin dapat membuat, menonaktifkan, dan mereset akses SM.
- Backend memeriksa store scope dan role pada setiap request.
## FR-02 — Employee Management

- SM dapat melihat, menambah, mengubah, dan menonaktifkan karyawan.
- Jabatan: SM, PIC, Staff; dukung eligibility per shift.
- Karyawan nonaktif tidak dipilih untuk jadwal baru; histori tetap tersimpan.
- Validasi satu SM pengelola utama dan tiga PIC per toko sesuai konfigurasi bisnis.
## FR-03 — Shift Configuration

- SM/Admin dapat mengatur nama, jam, overnight, eligibility, dan staffing minimum/maksimum.
- Kebutuhan staffing dapat berbeda menurut hari dan shift.
- Validasi min_staff <= max_staff serta konfigurasi waktu yang masuk akal.
## FR-04 — Weekly Scheduling

- SM memilih toko dan minggu; sistem memuat employee, shift, request off, dan jadwal sebelumnya.
- SM dapat menetapkan assignment manual sebelum generate.
- Hasil generator disimpan sebagai Draft untuk review; publish dilakukan terpisah.
## FR-05 — Request Off

- Request menyimpan karyawan, rentang tanggal, status, alasan opsional, approver, dan waktu approval.
- Hanya status Approved menjadi hard constraint.
- Request Pending ditampilkan sebagai warning; perubahan status diaudit.
## FR-06 — Manual Assignment & Lock

- SM dapat menambah/mengubah/menghapus assignment dan mengunci assignment.
- Generate ulang tidak boleh mengubah assignment locked secara diam-diam.
- Jika lock bertentangan dengan hard constraints, generator melaporkan konflik dan meminta tindakan SM.
## FR-07 — PIC Coverage

- Setiap hari wajib memiliki minimal satu PIC pada shift pagi dan minimal satu PIC pada shift closing.
- PIC yang sedang off atau tidak eligible tidak dihitung sebagai coverage.
- Jadwal tanpa coverage PIC tidak dapat dipublikasikan.
## FR-08 — Anti-Jumping / Rest Interval

- Tidak boleh ada overlap antar-shift dan interval istirahat harus >= minimum rest hours toko.
- Perhitungan memakai waktu aktual, tanggal, timezone, dan shift overnight.
- Perubahan konfigurasi rest interval langsung berlaku pada validasi/generate berikutnya.
## FR-09 — Random Generation & Fairness

- Randomisasi hanya memilih kandidat yang memenuhi seluruh hard constraints.
- Operational coverage menjadi prioritas optimasi, diikuti minimal changes saat regenerate, lalu fairness.
- Fairness mempertimbangkan distribusi pagi/middle/closing dan off dari histori yang relevan.
- Jika tidak ditemukan solusi, tampilkan konflik dan jangan menerbitkan jadwal invalid.
## FR-10 — Export PNG

- PNG memuat nama/logo toko bila tersedia, periode, seluruh nama, shift/jam, PIC, OFF, legenda warna, dan waktu update.
- Gambar harus terbaca di smartphone; nama panjang tidak boleh terpotong.
- Export resmi mengambil versi Published; draft hanya dapat diekspor secara eksplisit sebagai draft.
## FR-11 — Schedule Versioning

- Setiap generate/revisi menghasilkan Draft berversi; jadwal Published sebelumnya tetap utuh.
- Publish mengganti versi resmi secara atomik dan mempertahankan histori.
- Perubahan bersamaan harus dideteksi menggunakan version checking/optimistic locking.
# 7. Aturan Scheduling

## 7.1 Hard constraints

| ID | Constraint |
| --- | --- |
| HC-01 | Setiap karyawan aktif yang dijadwalkan untuk minggu penuh memperoleh tepat 2 hari tanpa assignment kerja. |
| HC-02 | Karyawan tidak boleh dijadwalkan pada tanggal yang tercakup approved request off. |
| HC-03 | Tidak boleh ada dua assignment yang overlap untuk karyawan yang sama. |
| HC-04 | Setiap hari memiliki minimal satu PIC di pagi dan satu PIC di closing. |
| HC-05 | Rest interval antarshift >= minimum_rest_hours toko. |
| HC-06 | Jumlah staff pada shift berada di antara min_staff dan max_staff yang dikonfigurasi. |
| HC-07 | Karyawan harus eligible untuk shift yang ditugaskan. |
| HC-08 | Assignment yang dikunci tidak boleh diubah otomatis; konflik lock harus dilaporkan. |
| HC-09 | Hanya jadwal yang lolos seluruh hard constraints dapat dipublikasikan. |


Catatan: HC-06 berlaku pada kebutuhan per shift yang dikonfigurasi. Bila tenaga yang tersedia tidak cukup, sistem harus menyatakan konflik dan tidak menurunkan minimum staffing secara otomatis.

## 7.2 Soft constraints / objective

- Memenuhi target staffing di atas minimum bila target tersebut dikonfigurasi.
- Meminimalkan perubahan dari assignment sebelumnya yang masih valid.
- Menyeimbangkan distribusi shift pagi, middle, dan closing.
- Menyeimbangkan hari off dan mempertimbangkan histori beberapa minggu.
- Menghormati preferensi tambahan yang tidak bertentangan dengan hard constraints.
## 7.3 Urutan optimasi

1. Pertama: temukan jadwal yang memenuhi seluruh hard constraints.
1. Kedua: optimalkan operational coverage/target staffing.
1. Ketiga: minimalkan perubahan dari jadwal sebelumnya.
1. Keempat: optimalkan fairness.
Untuk menghindari ambiguitas, urutan objective sebaiknya diterapkan secara lexicographic atau dengan bobot yang terbukti tidak memungkinkan objective prioritas rendah mengalahkan prioritas tinggi. Minimum staffing tetap hard constraint.

# 8. Generate Ulang dengan Minimal Change

1. Load jadwal terbaru beserta version/baseline.
1. Validasi konfigurasi, request off, eligibility, dan assignment lock.
1. Pertahankan assignment locked yang valid sebagai fixed assignments.
1. Pertahankan assignment unlocked yang masih valid sebagai baseline kandidat.
1. Lepaskan assignment yang wajib diperbaiki karena konflik; lepaskan slot tambahan hanya jika dibutuhkan untuk memperoleh solusi.
1. Cari jadwal valid yang meminimalkan jumlah perubahan dari baseline.
1. Jika perubahan sama, pilih kandidat dengan operational coverage terbaik lalu fairness terbaik.
1. Simpan hasil sebagai Draft baru; jangan mengubah jadwal Published sebelum publish.
Jika tidak ada solusi tanpa mengubah assignment locked yang konflik, sistem harus mengembalikan konflik. SM dapat membuka lock secara manual atau memperbaiki konfigurasi/request melalui proses yang berwenang.

# 9. Acceptance Criteria

| ID | Acceptance criteria |
| --- | --- |
| AC-01 — Dua hari off | Setiap karyawan aktif untuk minggu penuh memiliki tepat dua hari tanpa assignment; jadwal yang melanggar tidak dapat dipublikasikan. |
| AC-02 — Approved off | Karyawan tidak dijadwalkan pada tanggal approved off; konflik assignment lama diperbaiki tanpa mengubah status request otomatis. |
| AC-03 — Pending off | Pending ditampilkan sebagai warning dan tidak menjadi hard constraint sampai disetujui. |
| AC-04 — Rest interval | Assignment di bawah minimum rest ditolak; konfigurasi baru berlaku pada generate berikutnya. |
| AC-05 — SM randomisasi | SM dapat dijadwalkan pada shift yang eligible, mengikuti dua hari off dan rest interval, serta dihitung sebagai PIC. |
| AC-06 — PIC coverage | Setiap hari memiliki PIC pagi dan closing; PIC off/non-eligible tidak dihitung. |
| AC-07 — Staffing | Jumlah assignment setiap shift memenuhi rentang minimum/maksimum; PIC dihitung sebagai staff dan tidak diduplikasi. |
| AC-08 — Minimal change | Generate ulang mempertahankan assignment valid sebanyak mungkin dan tidak mengubah locked assignments. |
| AC-09 — Locked conflict | Konflik lock ditampilkan; tidak ada perubahan otomatis tersembunyi. |
| AC-10 — Validitas mengalahkan minimal change | Assignment yang melanggar approved off/rest/coverage wajib diperbaiki meskipun menambah jumlah perubahan. |
| AC-11 — Publish/versioning | Publish mengaktifkan versi baru secara atomik dan menyimpan versi sebelumnya sebagai histori. |
| AC-12 — Infeasible/timeout | Tidak ada hasil parsial yang dianggap valid; status infeasible dibedakan dari timeout tanpa solusi. |
| AC-13 — PNG export | PNG menampilkan semua informasi yang diperlukan dan terbaca pada smartphone. |
| AC-14 — Store isolation | SM tidak dapat mengakses data toko lain dengan mengubah URL, parameter, atau request API. |
| AC-15 — Concurrent editing | Perubahan bersamaan dideteksi; tidak ada update yang hilang tanpa peringatan. |


# 10. Data Model

## 10.1 Entitas utama

| Entity | Field utama / fungsi |
| --- | --- |
| Store | id, name, timezone, minimum_rest_hours, status. |
| User | id, email, password_hash, role, status. |
| Employee | id, store_id, user_id nullable, employee_code, name, job_role, active, effective_from, effective_until. |
| ShiftTemplate | id, store_id, code, name, start_time, end_time, overnight/eligibility metadata, active. |
| ShiftRequirement | id, store_id, day_of_week, shift_template_id, min_staff, max_staff, effective_from, effective_until. |
| TimeOffRequest | id, employee_id, start_date, end_date, status, reason, approved_by, approved_at, timestamps. |
| Schedule | id, store_id, week_start, version, parent_schedule_id, status, created_by, published_by, published_at. |
| ScheduleAssignment | id, schedule_id, employee_id, work_date, shift_template_id, is_locked, assignment_type, timestamps. |
| ScheduleGenerationRun | id, schedule_id nullable, store_id, requested_by, status, random_seed, algorithm_version, input_snapshot, conflicts, changes_count, duration_ms. |
| AuditLog | actor_id, store_id, action, entity_type, entity_id, changes, created_at. |


## 10.2 Constraint database

- Unique employee_id + schedule_id + work_date jika satu karyawan hanya boleh memiliki satu shift kerja per hari.
- Unique store_id + week_start + version untuk schedule versioning.
- Validasi min_staff <= max_staff dan batas nilai minimum_rest_hours.
- Transaksi database untuk menyimpan hasil generate dan publish.
- Pastikan hanya ada satu versi Published aktif per toko dan minggu.
- Audit perubahan konfigurasi, assignment, approval request, dan publish.
## 10.3 Kebijakan penyimpanan OFF

Rekomendasi MVP: simpan assignment kerja saja dan hitung OFF dari hari tanpa assignment. Dengan begitu, tidak ada row OFF yang bertabrakan dengan assignment kerja. Validasi mingguan harus memastikan tepat lima hari kerja dan dua hari tanpa assignment bagi karyawan aktif penuh minggu.

# 11. API Contract

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | /api/auth/login | Login. |
| GET | /api/stores/current | Detail toko aktif. |
| GET/POST | /api/employees | List dan tambah karyawan. |
| PATCH | /api/employees/:id | Update karyawan. |
| GET/POST | /api/shifts | List dan tambah shift template. |
| GET/POST | /api/shift-requirements | List dan atur staffing requirement. |
| POST | /api/time-off | Membuat request off. |
| PATCH | /api/time-off/:id | Approval/rejection/cancellation sesuai izin. |
| POST | /api/schedules/generate | Generate jadwal. |
| GET | /api/schedules?weekStart=YYYY-MM-DD | Ambil jadwal mingguan. |
| PATCH | /api/schedules/:id/assignments/:assignmentId | Ubah assignment. |
| POST | /api/schedules/:id/validate | Validasi jadwal. |
| POST | /api/schedules/:id/publish | Publikasi jadwal. |
| GET | /api/schedules/:id/export | Export PNG. |


## 11.1 Contoh request generate

{
  "storeId": "store_123",
  "weekStart": "2026-10-19",
  "preserveLockedAssignments": true,
  "randomSeed": 42817,
  "baselineScheduleId": "schedule_v1"
}

## 11.2 Contoh konflik

{
  "status": "INFEASIBLE",
  "scheduleId": null,
  "conflicts": [
    {
      "code": "NO_AVAILABLE_PIC_FOR_CLOSING",
      "date": "2026-10-20",
      "message": "Tidak ada PIC yang tersedia untuk shift closing."
    },
    {
      "code": "REST_INTERVAL_VIOLATION",
      "employeeId": "emp_004",
      "date": "2026-10-21",
      "message": "Istirahat antarshift kurang dari batas minimum."
    }
  ]
}

Status INFEASIBLE hanya digunakan bila solver membuktikan tidak ada solusi. Jika batas waktu tercapai tanpa solusi, gunakan TIME_LIMIT_REACHED atau NO_VALID_SCHEDULE_FOUND.

# 12. Rekomendasi Tech Stack

| Layer | Teknologi | Alasan |
| --- | --- | --- |
| Web application | Next.js App Router + TypeScript | Satu aplikasi modular untuk UI dan server-side logic. |
| UI | Tailwind CSS + shadcn/ui | Komponen dashboard dan form yang konsisten. |
| Database | PostgreSQL | Relasi, constraint, transaksi, histori, dan audit. |
| ORM | Prisma | Schema dan query terstruktur. |
| Validation | Zod | Validasi request dan konfigurasi. |
| Testing | Vitest + Playwright | Unit test constraints dan end-to-end flow. |
| Deployment | Vercel + managed PostgreSQL | Deployment awal sederhana; pilih region database yang dekat. |
| Scheduling engine | Modul service independen; pertimbangkan CP-SAT/integer programming | Constraint solver lebih cocok daripada random assignment sederhana. |


## 12.1 Arsitektur

src/
  app/
    (auth)/
    dashboard/
    employees/
    settings/shifts/
    schedules/
  modules/
    auth/
    stores/
    employees/
    shifts/
    availability/
    scheduling/
      generator.ts
      constraints.ts
      fairness.ts
      validator.ts
    exports/
  lib/
    db.ts
    auth.ts
    permissions.ts
prisma/
  schema.prisma

Gunakan modular monolith untuk MVP. Jangan menaruh seluruh scheduling logic di komponen React. Jika proses generate menjadi berat atau membutuhkan retry/background processing, modul scheduling dapat dipindahkan ke worker terpisah pada fase berikutnya.

# 13. Security, Reliability, dan Non-functional Requirements

- Password menggunakan algoritma hashing modern; token/session rahasia tidak boleh masuk log.
- Gunakan session cookie HttpOnly, Secure, dan SameSite yang sesuai dengan arsitektur autentikasi.
- Validasi store scope dan role pada server untuk semua operasi.
- Terapkan rate limiting untuk login dan endpoint sensitif; CSRF protection sesuai penggunaan cookie.
- Backup database dan uji prosedur pemulihan.
- Gunakan version checking/optimistic locking untuk concurrent editing.
- Target dashboard/jadwal terbuka sekitar 2 detik pada kondisi normal; harus diuji.
- Target awal generate <10 detik untuk 13 karyawan x 7 hari pada konfigurasi normal; ukur dengan benchmark.
- Tidak boleh memublikasikan jadwal yang melanggar hard constraints.
- Audit perubahan jadwal, approval, konfigurasi, dan publikasi.
# 14. Edge Cases dan QA

| Skenario | Hasil yang diharapkan |
| --- | --- |
| Semua PIC off di hari yang sama | Generator melaporkan konflik PIC; tidak publish. |
| Tidak cukup staff untuk minimum coverage | Tampilkan jumlah kekurangan per shift dan tanggal. |
| Approved off bentrok dengan assignment locked | Laporkan konflik; tidak mengubah lock secara diam-diam. |
| Shift melewati tengah malam | Overlap dan rest dihitung berdasarkan timestamp aktual. |
| Karyawan nonaktif | Tidak dipilih untuk jadwal baru; jadwal historis tetap tersedia. |
| Dua SM/tab mengedit bersamaan | Deteksi versi stale dan minta refresh/reconcile. |
| Konfigurasi berubah setelah draft dibuat | Validasi ulang sebelum publish; tampilkan konflik baru. |
| Generator timeout tanpa solusi | Tandai timeout, bukan proven infeasible; jangan publish. |
| Generate ulang tanpa perubahan input | Pertahankan assignment valid sebanyak mungkin. |
| Export dari draft | Tandai sebagai draft; export resmi harus memakai versi Published. |


# 15. Roadmap

| Phase | Scope |
| --- | --- |
| P1 — Foundation | Auth, role/store isolation, employee management, shift settings, database schema. |
| P2 — Scheduling core | Off requests, constraints, PIC coverage, rest interval, staffing, generator, manual lock. |
| P3 — Release | Minimal-change regeneration, validation panel, draft/publish/versioning, PNG export, audit log, integration tests. |
| P4 — Enhancements | Staff self-service request off, notification, PDF, cross-store reporting, fairness analytics. |


Estimasi awal untuk satu developer full-stack berpengalaman: sekitar 3–6 minggu untuk MVP, bergantung pada kompleksitas solver, UI, dan pengujian. Estimasi perlu diperbarui setelah technical design dan proof-of-concept generator.

# 16. Definition of Done

- SM dapat login dan hanya mengakses toko yang berwenang.
- Jam shift, staffing requirement, dan minimum rest interval dapat dikonfigurasi.
- SM ikut dijadwalkan dan diperlakukan sebagai PIC.
- Setiap karyawan aktif untuk minggu penuh memiliki tepat dua hari off.
- Approved request off selalu dihormati.
- PIC pagi dan closing tersedia pada jadwal valid setiap hari.
- Anti-jumping bekerja berdasarkan waktu aktual termasuk shift overnight.
- Generate ulang mempertahankan assignment valid sebanyak mungkin dan tidak mengubah lock diam-diam.
- Draft dan published memiliki versioning serta histori.
- Jadwal invalid tidak dapat dipublikasikan.
- Infeasible dan timeout dibedakan.
- PNG terbaca di smartphone dan mencakup seluruh karyawan.
- Unit, integration, dan end-to-end tests mencakup hard constraints serta edge cases.
# 17. Risiko dan Keputusan Lanjutan

- Pastikan kebijakan dua hari off konsisten untuk karyawan yang aktif hanya sebagian minggu; gunakan effective dates atau kebijakan prorata yang disepakati.
- Tetapkan apakah target staffing di atas minimum merupakan preferensi atau kewajiban. PRD ini menetapkan minimum/maximum sebagai hard bounds dan target tambahan sebagai objective.
- Tetapkan nilai awal minimum rest interval berdasarkan kebijakan perusahaan dan aturan yang berlaku.
- Definisikan aturan eligibility dan ketersediaan khusus bila kelak SM/PIC memiliki pembatasan jadwal.
- Lakukan simulasi generator dengan banyak konfigurasi dan random seed sebelum rollout ke semua toko.
# Lampiran A — Pseudocode Generator

generateSchedule(store, week, previousSchedule):
  input = loadSchedulingInput(store, week)
  validateConfiguration(input)
  validateApprovedTimeOff(input)
  validateLockedAssignments(input)

  constraints = buildHardConstraints(
    weeklyOffDays = 2,
    approvedTimeOff = input.approvedRequests,
    minimumRestHours = input.store.minimumRestHours,
    picMorningRequired = true,
    picClosingRequired = true,
    staffingRequirements = input.shiftRequirements,
    employeeEligibility = input.eligibility,
    lockedAssignments = input.lockedAssignments
  )

  objective = lexicographicMinimize(
    changesFromBaseline,
    operationalCoverageDeviation,
    fairnessPenalty
  )

  result = solve(constraints, objective, timeLimit)

  if result.provenInfeasible:
    return INFEASIBLE with conflicts
  if result.timedOutWithoutSolution:
    return TIME_LIMIT_REACHED
  if not validateAllHardConstraints(result.schedule):
    return FAILED

  saveAsDraft(result.schedule, parentVersion=previousSchedule.version)
  return SUCCEEDED

# Lampiran B — Perhitungan Kapasitas Mingguan

Untuk 13 karyawan yang aktif selama tujuh hari penuh, dengan tepat dua hari off per karyawan: 13 x 7 = 91 hari-karyawan; 13 x 2 = 26 hari-karyawan off; 91 - 26 = 65 hari-karyawan kerja. Rata-rata adalah sekitar 9,3 karyawan bekerja per hari. Ini tidak menjamin staffing feasible karena PIC, eligibility, approved off, dan kebutuhan setiap shift juga harus dipenuhi.


— Akhir Dokumen —
