# SPMB Architecture Graph (Untuk Maintenance & Pengembangan)

Dokumentasi ini dibuat untuk memudahkan pemahaman arsitektur aplikasi, alur data, dan dependencies antar komponen agar perbaikan dan pengembangan lebih terarah.

## Overview

**SPMB (Sistem Penerimaan Murid Baru)** adalah aplikasi web serverless untuk SMKS Al Azhar Sempu dengan arsitektur:
- **Frontend**: React 18 + TypeScript + Vite (SPA)
- **Backend**: Google Apps Script (Web App) sebagai REST API
- **Database**: Google Sheets (13 sheets otomatis)
- **Storage**: Google Drive (upload berkas)
- **Auth**: Google Identity Services (OAuth 2.0)
- **Hosting**: Firebase Hosting untuk frontend

## 1. Arsitektur Tingkat Tinggi

`mermaid
graph TD
    A[User Browser] --> B[Firebase Hosting - SPA React]
    B --> C[Google Apps Script Web App - API]
    C --> D[Google Sheets - Database]
    C --> E[Google Drive - File Storage]
    C --> F[Google Calendar - Events]
    C --> G[Google Identity Services - Auth]
    D --> C
    E --> C
    F --> C
    G --> C
`

## 2. Frontend Architecture

### Struktur Direktori
`
spmb-frontend/src/
├── App.tsx          # Router & ProtectedRoute (role-based)
├── main.tsx         # Entry point
├── pages/           # Halaman per role
│   ├── login/       # Login & Register
│   ├── student/     # Portal calon siswa
│   ├── admin/       # Portal admin
│   ├── guru/        # Portal guru (guru & guru_smp)
│   └── mpls/        # Portal panitia MPLS
├── components/      # Reusable UI components
├── services/api.ts  # API client layer
├── store/           # Zustand stores (auth, student)
├── hooks/           # Custom hooks
├── utils/           # Utilities
├── types/           # TypeScript types
└── data/constants.ts # Konstanta (program keahlian, dll)
`

### Routing & Role Management
- **Public**: /, /register
- **Siswa**: /student/* (dashboard, wizard, kartu-pendaftaran)
- **Admin**: /admin/* (nested routes dengan AdminLayout)
- **Guru/Guru SMP**: /guru/* (role bisa array ['guru', 'guru_smp'])
- **Panitia MPLS**: /mpls/* (scan QR, absensi, izin)

**ProtectedRoute** memverifikasi login status dan role dari uthStore.

### State Management (Zustand)
- uthStore - user info, session token, login/logout
- studentStore - data pendaftaran siswa

### API Layer (services/api.ts)
Fitur penting:
- **Auto-retry** dengan exponential backoff untuk network/5xx/429 (kecuali non-idempotent: register, auth, upload)
- **Timeout**: 30s default, 120s untuk heavy actions (upload, register, adminRegisterSiswa, auth)
- **Session management** via localStorage (spmb.session-token, spmb.session)
- **Friendly error messages** untuk UX yang lebih baik
- **Drive image URL helper** untuk thumbnail Google Drive

## 3. Backend Architecture (Google Apps Script)

### Entry Points
- doGet() - Health check
- doPost() - API router utama
- doOptions() - CORS preflight

### Routing System (Code.gs)
Semua request dikirim dengan ction parameter. Router memetakan action → handler + allowed roles.
Guard equireAuth_() memverifikasi session token dan role untuk protected routes.

### Module Breakdown

| File | Fungsi | Keterangan |
|---|---|---|
| Code.gs | Router & entry points | Orkestrasi request, auth guard, JSON response |
| AuthHandler.gs | Authentication | Google token verification, register, generate ID pendaftaran (format: XXXX-YYYY) |
| Security.gs | Security layer | Session token generation/validation, rate limiting, authorization |
| SheetManager.gs | Database abstraction | Inisialisasi 13 sheets, schema, CRUD helper functions |
| SiswaHandler.gs | Student management | getSiswa, updateSiswa, adminRegisterSiswa, deleteSiswa, referral stats |
| AdminHandler.gs | User management | CRUD admin, guru, guru_smp |
| ConfigHandler.gs | Configuration | Gelombang, sistem config, broadcast events |
| TimelineHandler.gs | Timeline management | Tahapan SPMB CRUD |
| EngagementHandler.gs | Social features | Like & komentar pada event/broadcast |
| CalendarHandler.gs | Calendar integration | Google Calendar events & reminders |
| MplsHandler.gs | MPLS features | Lookup by ID, absensi, izin |
| DriveHandler.gs | File upload | Upload berkas ke Google Drive, set permissions |
| PhoneLib.gs | Phone normalization | Bundled google-libphonenumber untuk format nomor HP Indonesia |
| SeedData.gs | Initial data | Seed 3 gelombang & konfigurasi sistem |

### Database Schema (Google Sheets)
SheetManager.gs menginisialisasi 13 sheet secara otomatis. Struktur detail bisa dilihat di SheetManager.gs.

### Security Features
- **Session tokens** dengan expiry
- **Rate limiting** via PropertiesService/LockService
- **Role-based access control** di level route
- **LockService** untuk mencegah race condition
- **Google token verification** di AuthHandler

## 4. Data Flow

### Registrasi & Login Siswa
`mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant G as Google Auth
    participant B as GAS API
    participant S as Sheets
    
    U->>F: Login dengan Google
    F->>G: getIdToken()
    G->>F: ID Token
    F->>B: POST {action:'auth', token:...}
    B->>G: Verify token
    B->>S: Cek user di sheet Users/Siswa
    alt User baru
        B->>S: Create user record
        B->>F: return session token + user data (role:siswa)
        F->>F: Redirect ke /student/wizard
    else User existing
        B->>F: return session token + user data
        F->>F: Redirect sesuai role
    end
`

### Pendaftaran Siswa (Wizard)
Frontend: StudentWizard (5 langkah) → pi.call('updateSiswa', {...}) → Backend: handleUpdateSiswa → update data di sheet Siswa + upload berkas ke Drive jika ada.

### Admin Operations
Admin dapat mendaftar siswa manual via dminRegisterSiswa, mengelola users, gelombang, timeline, broadcast event.

### MPLS Flow
Panitia scan QR kartu pendaftaran → mplsLookupById → tampilkan data siswa → mplsAddKehadiran untuk absensi.

## 5. Key Files untuk Maintenance

### Frontend Critical
| File | Alasan |
|---|---|
| src/App.tsx | Routing & role protection - perlu diupdate saat tambah role/route baru |
| src/services/api.ts | API client - core komunikasi dengan backend |
| src/store/authStore.ts | Auth state management |
| src/types/index.ts | Type definitions - perlu sync dengan backend |
| src/data/constants.ts | Program keahlian, pilihan dropdown |

### Backend Critical
| File | Alasan |
|---|---|
| ackend-gas/Code.gs | Router utama - tambah action baru di sini |
| ackend-gas/SheetManager.gs | Schema DB - tambah kolom/sheet baru |
| ackend-gas/AuthHandler.gs | Auth logic |
| ackend-gas/Security.gs | Security - hati-hati saat mengubah |
| ackend-gas/SiswaHandler.gs | Core business logic pendaftaran |

## 6. Dependencies Graph

### Frontend Dependencies
- **Routing**: react-router-dom
- **State**: zustand
- **UI/Icons**: lucide-react
- **QR**: qrcode.react, html5-qrcode
- **OCR**: tesseract.js
- **Excel**: xlsx
- **Auth**: @react-oauth/google (lihat package.json)
- **Build**: vite, typescript

### Backend Dependencies
- **Runtime**: Google Apps Script V8
- **Built-in**: SpreadsheetApp, DriveApp, CalendarApp, PropertiesService, LockService, UrlFetchApp
- **Bundled**: google-libphonenumber (via PhoneLib.gs, built with esbuild)

## 7. Tips Maintenance

### Menambah Route/Action Baru
1. **Frontend**: Tambah route di App.tsx, buat halaman di pages/, panggil via pi.call('actionName', params)
2. **Backend**: Tambah handler function, daftarkan di ROUTES di Code.gs dengan role yang sesuai

### Menambah Field di Form Pendaftaran
1. Update tipe di src/types/ 
2. Update form di StudentWizard atau halaman terkait
3. Update SiswaHandler.gs untuk handle field baru
4. Update schema di SheetManager.gs jika perlu tambah kolom
5. Pastikan konsisten antara frontend dan backend

### Debugging
- **Frontend**: DevTools Network tab, cek request ke GAS Web App URL
- **Backend**: Apps Script Execution logs, console.log() muncul di Executions
- **CORS/Auth issues**: Periksa session token, role, dan deployment GAS (harus "Execute as me", "Anyone with Google account")

### Deployment
- **Frontend**: 
pm run build → deploy ke Firebase Hosting (irebase deploy)
- **Backend**: Push dengan clasp push atau 
pm run push di ackend-gas/, lalu deploy/redeploy Web App

## 8. Quick Reference - File Locations

**Untuk mencari logic tertentu:**
- Login/Auth flow → rontend/services/api.ts + ackend-gas/AuthHandler.gs
- Pendaftaran siswa → rontend/pages/student/StudentWizard.tsx + ackend-gas/SiswaHandler.gs
- Admin manage siswa → rontend/pages/admin/AdminSiswa.tsx + ackend-gas/SiswaHandler.gs
- MPLS absensi → rontend/pages/mpls/MplsScan.tsx + ackend-gas/MplsHandler.gs
- Upload berkas → rontend/... + ackend-gas/DriveHandler.gs
- Role & routing → rontend/App.tsx + ackend-gas/Code.gs

---

*Dokumen ini membantu memahami arsitektur untuk maintenance dan pengembangan lebih lanjut. Untuk detail implementasi, lihat file terkait.*
