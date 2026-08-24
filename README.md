# SPMB — Sistem Penerimaan Murid Baru

**SMKS Al Azhar Sempu** · Serverless & Cloud Database (Google Workspace)

SPMB adalah aplikasi web **Single Page Application (SPA)** untuk pendaftaran murid baru secara online. Aplikasi ini menggunakan **Google OAuth 2.0** sebagai satu gerbang masuk, **Google Apps Script** sebagai backend, **Google Sheets** sebagai database, **Google Drive** untuk penyimpanan berkas, dan **Google Calendar** untuk pengingat agenda — semuanya berbasis ekosistem cloud gratis tanpa biaya infrastruktur.

## Fitur Utama

| Peran | Fitur |
|---|---|
| **Calon Murid** | Login Google OAuth; wizard pendaftaran 5 langkah (jurusan utama & alternatif, data pribadi + NISN opsional, alamat + koordinat peta, orang tua/wali, berkas & prestasi); pindai KK/KTP untuk pengisian alamat otomatis (OCR); dropdown referral dinamis (nama guru SMKS, atau guru SMP/MTs tersaring per asal sekolah); upload pas foto & PDF gabungan; kartu pendaftaran digital ber-QR; timeline tahapan SPMB; feed pengumuman ala Instagram (suka, komentar, tambah agenda ke Google Calendar + pengingat email). |
| **Admin** | Dashboard statistik & grafik; tabel & pencarian pendaftar; daftarkan siswa manual; import data via Excel (xlsx); kelola gelombang & tahun ajaran aktif; kelola timeline tahapan SPMB; broadcast event personal ke email; statistik referral; manajemen pengguna (admin/guru/panitia CRUD) termasuk mengelola akun Guru SMP/MTs hasil registrasi mandiri; verifikasi berkas. |
| **Guru SMKS** | Dashboard statistik pendaftar (total, status, distribusi jurusan & gelombang); daftarkan siswa dengan referral terkunci atas nama sendiri. |
| **Guru SMP/MTs (`guru_smp`)** | Registrasi mandiri via halaman Registrasi (wajib Gmail + asal sekolah); dashboard khusus yang hanya menampilkan pendaftar dari sekolahnya sendiri (filter di sisi server, tanpa persaingan antar sekolah); daftarkan siswa dengan asal sekolah & referral terisi otomatis dari akun. |
| **Panitia MPLS** | Scan QR kartu pendaftaran / lookup manual ID; absensi kehadiran harian; manajemen izin (sakit/keluarga/lainnya); dashboard & informasi MPLS. |
| **Umum** | Satu gerbang login + deteksi peran otomatis; otorisasi peran di sisi server; kartu digital ber-QR; notifikasi personal. |

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand (state management), React Router, `qrcode.react` (kartu QR), `html5-qrcode` (scan QR), `xlsx` (import Excel), `lucide-react` (ikon) |
| **Backend** | Google Apps Script (runtime V8), Google Sheets (database), Google Drive (upload berkas), Google Calendar (event & pengingat), Google Identity Services (OAuth 2.0), `LockService` (anti race condition) |

## Struktur Proyek

```
SPMB/
├─ spmb-frontend/              # React + Vite SPA
│  ├─ src/
│  │  ├─ pages/                # login, student (wizard 5 langkah), admin, guru, mpls
│  │  ├─ components/           # UI kit (Button, Card, StatCard, DonutChart, Toast, …)
│  │  ├─ services/api.ts       # lapisan pemanggil API (action + session token)
│  │  ├─ store/                # Zustand (authStore, studentStore)
│  │  ├─ types/                # tipe TypeScript
│  │  └─ data/constants.ts     # jurusan, agama, proyeksi karir, kategori referral
│  ├─ .env.example             # template variabel lingkungan
│  ├─ firebase.json            # konfigurasi Firebase Hosting (public: dist)
│  └─ .firebaserc              # project Firebase Hosting (spmbskalzar)
├─ backend-gas/                # Google Apps Script backend
│  ├─ Code.gs                  # router action + guard role
│  ├─ SheetManager.gs          # koneksi & skema Google Sheets (12 sheet otomatis)
│  ├─ AuthHandler.gs           # login OAuth, registrasi, generate ID pendaftaran
│  ├─ Security.gs              # session token, rate limit, otorisasi
│  ├─ SiswaHandler.gs          # CRUD data siswa
│  ├─ AdminHandler.gs          # CRUD admin/guru/panitia
│  ├─ ConfigHandler.gs         # konfigurasi gelombang, sistem & broadcast event
│  ├─ EngagementHandler.gs     # like & komentar event
│  ├─ CalendarHandler.gs       # event Google Calendar & pengingat
│  ├─ TimelineHandler.gs       # tahapan SPMB
│  ├─ MplsHandler.gs           # absensi & izin MPLS
│  ├─ DriveHandler.gs          # upload berkas ke Google Drive
│  ├─ SeedData.gs              # data awal (3 gelombang, konfigurasi sistem)
│  └─ appsscript.json          # manifest (scope & web app)
├─ logo.svg
└─ RPD.md                      # dokumen rancangan teknis
```

## Cara Menjalankan

### A. Prasyarat

- **Node.js ≥ 18** dan **npm**
- Akun Google (Gmail) sebagai pemilik spreadsheet & deployment
- Kredensial **OAuth 2.0 Client** di [Google Cloud Console](https://console.cloud.google.com):
  - Aktifkan Google Identity Services API
  - Isi **Authorized JavaScript origins** dengan alamat frontend Anda
    (saat lokal: `http://localhost:5173`)

### B. Setup Backend (Google Apps Script)

> Petunjuk lengkap termasuk daftar API per `action` tersedia di [`backend-gas/README.md`](backend-gas/README.md).

1. **Buat project Apps Script** di https://script.google.com, beri nama mis. `SPMB-Backend`.
2. **Salin seluruh file `.gs`** dari folder `backend-gas/` ke project, serta `appsscript.json` ke **Project Settings > Show manifest file**.
3. **Set Script Properties** di **Project Settings > Script Properties**:

   | Key | Value |
   |---|---|
   | `SHEET_ID` | *(Opsional)* ID Google Sheet. Kosongkan agar dibuat otomatis berjudul `SPMB - Data` |
   | `GOOGLE_CLIENT_ID` | Client ID frontend (`VITE_GOOGLE_CLIENT_ID`) — dipakai validasi `aud` token Google |

4. **Deploy sebagai Web App**:
   - Klik **Deploy > New deployment**
   - Type: **Web app**
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
   - Klik **Deploy**, lalu **salin URL** (`https://script.google.com/macros/s/.../exec`).

> Skema 12 sheet dan data awal (3 gelombang pendaftaran + konfigurasi sistem) dibuat **otomatis** oleh `initializeSheets()` saat API pertama kali dipanggil. Aksi `setup` hanya berlaku **sekali** sebelum `SHEET_ID` di-set.

### C. Setup Frontend

```bash
cd spmb-frontend
npm install
```

Salin template variabel lingkungan dan isi nilainya:

```bash
cp .env.example .env
```

```
VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

Jalankan server pengembangan:

```bash
npm run dev
```

Buka `http://localhost:5173` dan login dengan akun Google.

### D. Login Pertama

1. **Calon murid baru** — email Google belum terdaftar → alur **registrasi siswa** (buat akun pendaftaran) → lanjut mengisi wizard 5 langkah.
2. **Admin / Guru / Panitia MPLS** — email harus terdaftar pada sheet `Admin` dengan kolom `role` yang sesuai (`admin`, `guru`, `guru_smp`, `panitia_mpls`). Tambahkan secara manual di spreadsheet (atau lewat menu **Manajemen** di dashboard admin).
3. **Guru SMP/MTs** — buka halaman **Registrasi**, pilih peran *Guru SMP/MTs*, lengkapi nama & asal sekolah → akun langsung aktif dan tersimpan pada sheet `Guru`.

## Variabel Lingkungan

| Variabel | Deskripsi |
|---|---|
| `VITE_API_URL` | URL Web App Apps Script (format `https://script.google.com/macros/s/.../exec`) |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID aplikasi Google (divalidasi sebagai `aud` token di backend) |

## Deployment

### Backend

1. Lakukan perubahan pada project Apps Script lalu **Deploy > Manage deployments > Edit > New version**.
2. Setiap perubahan `SHEET_ID` / `GOOGLE_CLIENT_ID` dilakukan via **Script Properties**.

### Frontend

Build produksi menghasilkan folder `dist/`, lalu diterbitkan ke **Firebase Hosting** (proyek `spmbskalzar`, konfigurasi di `firebase.json`):

```bash
cd spmb-frontend
npm run build
npx firebase deploy --only hosting
```

> Pastikan **Authorized JavaScript origins** pada OAuth Client di Cloud Console memuat URL hosting produksi Anda (mis. `https://<project-id>.web.app`).

### Cek Kualitas Kode

```bash
cd spmb-frontend
npm run lint
```

## Keamanan

- **Validasi token Google di server** — `idToken` diverifikasi ke Google (cek `aud`, `email_verified`) sebelum login/registrasi diterima; login dengan email polos tidak diizinkan.
- **Session token acak** — sesi TTL 6 jam di Cache, setiap request wajib menyertakan token.
- **Otorisasi peran di server** — setiap action memiliki daftar role yang diizinkan (bukan sekadar guard UI).
- **Isolasi data antar sekolah** — data siswa yang diterima role `guru_smp` difilter di server berdasarkan asal sekolah akun gurunya.
- **Anti race condition** — `LockService` mengunci database saat registrasi/simpan untuk mencegah duplikasi ID & tabrakan baris.
- **Rate limiting** — batas percobaan login/registrasi per email.
- **Upload terkendali** — file dikonversi Base64 di browser dengan batas ukuran (pas foto ≤ 2 MB, PDF gabungan ≤ 5 MB).

## Struktur Data Google Sheets

12 sheet dibuat otomatis oleh `SheetManager.gs`:

| Sheet | Kegunaan |
|---|---|
| `Siswa` | Data registrasi calon murid |
| `Pengaturan_Gelombang` | Konfigurasi gelombang pendaftaran |
| `Sistem_Config` | Key-value konfigurasi global (tahun ajaran aktif, dll.) |
| `Admin` | Daftar admin/guru/panitia beserta role |
| `Guru` | Pendaftaran mandiri Guru SMP/MTs (email, nama, role, no_telp, created_at, asal_sekolah) |
| `Informasi_Event` | Riwayat notifikasi/broadcast event |
| `Event_Like` | Data like event |
| `Event_Komentar` | Data komentar event |
| `Event_Pengingat` | Pengingat Google Calendar per pengguna |
| `Kehadiran_MPLS` | Log absensi siswa baru (scan QR) |
| `Izin_MPLS` | Catatan izin peserta MPLS |
| `Timeline_SPMB` | Tahapan-tahapan kegiatan SPMB |

## Referensi

- [Dokumentasi API Backend](backend-gas/README.md) — daftar lengkap `action` beserta contoh request
- [Dokumen Rancangan (RPD)](RPD.md) — arsitektur, skema database, dan analisis keamanan

## Lisensi

**Private / All rights reserved.** Kode pada repositori ini tidak boleh disalin, dimodifikasi, atau didistribusikan tanpa izin tertulis dari pemilik.
