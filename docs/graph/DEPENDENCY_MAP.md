# SPMB Dependency Map (Frontend <-> Backend)

Peta dependensi ini berguna untuk tracking impact saat melakukan perubahan.

## API Endpoint Mapping

| Action (Backend) | Handler | Roles | Frontend Usage | Keterangan |
|---|---|---|---|---|
| uth | AuthHandler.gs | - | pi.ts (login) | Verifikasi Google token, create/get user |
| egister | AuthHandler.gs | - | RegisterPage | Registrasi user baru |
| getSiswa | SiswaHandler.gs | siswa,admin,guru,guru_smp,panitia_mpls | StudentDashboard, AdminSiswa, dll | Ambil data siswa |
| updateSiswa | SiswaHandler.gs | siswa,admin | StudentWizard | Update data pendaftaran |
| dminRegisterSiswa | SiswaHandler.gs | admin,guru,guru_smp | AdminDaftarSiswa, GuruDaftarSiswa | Daftar siswa manual |
| deleteSiswa | SiswaHandler.gs | admin | AdminSiswa | Hapus siswa |
| deleteAllSiswa | SiswaHandler.gs | admin | AdminSiswa | Hapus semua |
| getReferralStats | SiswaHandler.gs | admin,guru,guru_smp | AdminReferral, GuruDashboard | Statistik referral |
| getGelombang | ConfigHandler.gs | semua yang login | Berbagai halaman | Info gelombang |
| updateGelombang | ConfigHandler.gs | admin | AdminGelombang | Update gelombang |
| deleteGelombang | ConfigHandler.gs | admin | AdminGelombang | Hapus gelombang |
| getConfig | ConfigHandler.gs | semua yang login | Berbagai halaman | Konfigurasi sistem |
| updateConfig | ConfigHandler.gs | admin | AdminDashboard/settings | Update config |
| getEvents | ConfigHandler.gs | semua yang login | Dashboard, Broadcast | Ambil event/broadcast |
| sendBroadcast | ConfigHandler.gs | admin,panitia_mpls | AdminBroadcast | Kirim broadcast/event |
| deleteEvent | ConfigHandler.gs | admin,panitia_mpls | AdminBroadcast | Hapus event |
| updateEvent | ConfigHandler.gs | admin,panitia_mpls | AdminBroadcast | Update event |
| upload | DriveHandler.gs | siswa,admin,panitia_mpls | StudentWizard | Upload berkas ke Drive |
| getEngagement | EngagementHandler.gs | semua yang login | Dashboard | Ambil like/komentar |
| 	oggleLike | EngagementHandler.gs | semua yang login | Dashboard | Like/unlike |
| ddKomentar | EngagementHandler.gs | semua yang login | Dashboard | Tambah komentar |
| sendReminder | CalendarHandler.gs | semua yang login | Dashboard | Kirim reminder |
| getTimeline | TimelineHandler.gs | semua yang login | Dashboard, AdminTimeline | Ambil timeline SPMB |
| ddTimeline | TimelineHandler.gs | admin | AdminTimeline | Tambah timeline |
| updateTimeline | TimelineHandler.gs | admin | AdminTimeline | Update timeline |
| deleteTimeline | TimelineHandler.gs | admin | AdminTimeline | Hapus timeline |
| getAdminList | AdminHandler.gs | admin | AdminManajemen | Daftar admin/guru/panitia |
| ddAdmin | AdminHandler.gs | admin | AdminManajemen | Tambah user baru |
| updateAdmin | AdminHandler.gs | admin | AdminManajemen | Update user |
| deleteAdmin | AdminHandler.gs | admin | AdminManajemen | Hapus user |
| getGuruList | AdminHandler.gs | admin | AdminManajemen | Daftar guru/guru_smp |
| deleteGuru | AdminHandler.gs | admin | AdminManajemen | Hapus guru/guru_smp |
| getReferralOptions | SiswaHandler.gs | semua yang login | Wizard, AdminDaftarSiswa | Opsi referral (guru/guru_smp) |
| mplsLookupById | MplsHandler.gs | panitia_mpls,admin,guru | MplsScan | Lookup siswa by ID pendaftaran |
| mplsAddKehadiran | MplsHandler.gs | panitia_mpls,admin | MplsScan | Catat absensi |
| mplsGetKehadiran | MplsHandler.gs | panitia_mpls,admin,guru | MplsDashboard/Izin | Ambil data kehadiran |
| mplsAddIzin | MplsHandler.gs | panitia_mpls,admin | MplsIzin | Tambah izin siswa |
| mplsGetIzin | MplsHandler.gs | panitia_mpls,admin,guru | MplsIzin/Dashboard | Ambil data izin |
| mplsDeleteIzin | MplsHandler.gs | panitia_mpls,admin | MplsIzin | Hapus izin |

## Component Dependencies

### Frontend Pages -> Services/Stores
`
pages/login/* -> services/api.ts, store/authStore.ts
pages/student/* -> services/api.ts, store/authStore.ts, store/studentStore.ts
pages/admin/* -> services/api.ts, store/authStore.ts
pages/guru/* -> services/api.ts, store/authStore.ts
pages/mpls/* -> services/api.ts, store/authStore.ts
`

### Shared Components
Components di src/components/ digunakan lintas role - check usage untuk impact analysis.

## Impact Analysis Guide

Saat mengubah sesuatu, perhatikan:
1. **Mengubah action di backend** → cari semua pemanggilan pi.call() di frontend
2. **Mengubah tipe data** → update src/types/ dan pastikan kompatibel dengan backend response
3. **Mengubah role** → update App.tsx routing dan ROUTES di Code.gs
4. **Mengubah schema sheet** → update SheetManager.gs dan handler terkait
5. **Mengubah auth flow** → update uthStore.ts, pi.ts, AuthHandler.gs, Security.gs
