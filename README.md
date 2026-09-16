# SPMB — Portal Penerimaan Murid Baru

**SMKS Al Azhar Sempu** · Serverless & Cloud Database (Google Workspace)

SPMB adalah portal penerimaan murid baru berbasis web untuk mengelola pendaftaran dari pengisian formulir hingga pendataan MPLS. Aplikasi terdiri dari frontend React/Vite dan backend Google Apps Script yang terhubung dengan Google Sheets, Google Drive, dan Google Calendar.

Semua pengguna masuk melalui Google Sign-In. Setelah token diverifikasi di server, aplikasi mengarahkan pengguna ke area sesuai perannya: calon murid, admin, guru, guru SMP/MTs, atau panitia MPLS.

## Alur dan Fitur Utama

| Peran | Fitur |
|---|---|
| **Calon murid** | Registrasi dan login Google; wizard pendaftaran 5 langkah; pilihan program keahlian; data pribadi, alamat, orang tua/wali, berkas, dan prestasi; OCR KK/KTP untuk alamat; referral; kartu pendaftaran dengan QR; timeline dan pengumuman. |
| **Admin** | Dashboard statistik; daftar dan pencarian pendaftar; pendaftaran manual; import/export Excel; verifikasi dan formulir pendaftaran; pengaturan gelombang dan timeline; broadcast; statistik referral; manajemen pengguna. |
| **Guru SMKS** | Melihat statistik dan daftar pendaftar serta mendaftarkan calon murid dengan referral atas nama sendiri. |
| **Guru SMP/MTs** | Registrasi mandiri dengan asal sekolah; hanya melihat pendaftar dari sekolahnya; mendaftarkan calon murid dengan asal sekolah dan referral otomatis. |
| **Panitia MPLS** | Dashboard MPLS; scan QR atau pencarian ID pendaftaran; absensi harian; pencatatan izin; informasi MPLS. |

### Rute Frontend

| Area | Rute utama |
|---|---|
| Login dan registrasi | `/`, `/register` |
| Portal siswa | `/student/dashboard`, `/student/wizard`, `/student/kartu-pendaftaran` |
| Admin | `/admin/dashboard`, `/admin/siswa`, `/admin/gelombang`, `/admin/timeline`, `/admin/broadcast`, `/admin/admin-manajemen` |
| Guru | `/guru/dashboard`, `/guru/daftarkan-siswa`, `/guru/formulir` |
| MPLS | `/mpls/dashboard`, `/mpls/scan`, `/mpls/izin`, `/mpls/informasi` |

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand (state management), React Router, `qrcode.react` (kartu QR), `html5-qrcode` (scan QR), `tesseract.js` (OCR KK/KTP), `xlsx` (import Excel), `lucide-react` (ikon), Vitest + Testing Library & Playwright (pengujian) |
| **Backend** | Google Apps Script (runtime V8), Google Sheets (database), Google Drive (upload berkas), Google Calendar (event & pengingat), Google Identity Services (OAuth 2.0), `LockService` (anti race condition), `google-libphonenumber` + esbuild (bundle normalisasi nomor HP) |

## Struktur Proyek

```
SPMB/
├─ spmb-frontend/              # React + Vite SPA
│  ├─ src/
│  │  ├─ pages/                # login, student, admin, guru, dan mpls
│  │  ├─ components/           # UI kit (Button, Card, StatCard, DonutChart, Toast, …)
│  │  ├─ services/api.ts       # lapisan pemanggil API (action + session token)
│  │  ├─ store/                # Zustand (authStore, studentStore)
│  │  ├─ types/                # tipe TypeScript
│  │  └─ data/constants.ts     # program keahlian, agama, proyeksi karir, kategori referral
│  ├─ .env.example             # template variabel lingkungan
│  ├─ firebase.json            # konfigurasi Firebase Hosting (public: dist)
│  └─ .firebaserc              # project Firebase Hosting (spmbskalzar)
├─ backend-gas/                # Google Apps Script backend
│  ├─ Code.gs                  # router action + guard role
│  ├─ SheetManager.gs          # koneksi & skema Google Sheets (13 sheet otomatis)
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
│  ├─ PhoneLib.gs              # bundle google-libphonenumber (generated via esbuild)
│  ├─ src/phone.js + build.js  # sumber & konfigurasi esbuild untuk PhoneLib.gs
│  ├─ package.json             # skrip npm (bundle, push, redeploy)
│  └─ appsscript.json          # manifest (scope & web app)
├─ logo.svg
└─ RPD.md                      # dokumen rancangan teknis
```

## Menjalankan Secara Lokal

### A. Prasyarat

- **Node.js ≥ 18** dan **npm**
- Akun Google sebagai pemilik spreadsheet dan deployment Apps Script
- OAuth Client ID dari [Google Cloud Console](https://console.cloud.google.com)
- Google Apps Script Web App yang dapat diakses frontend

> Frontend tidak dapat login atau memuat data tanpa `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, dan backend yang sudah dideploy.

### B. Setup Backend (Google Apps Script)

> Petunjuk lengkap termasuk daftar API per `action` tersedia di [`backend-gas/README.md`](backend-gas/README.md).

1. **Buat project Apps Script** di https://script.google.com, misalnya `SPMB-Backend`.
2. **Salin seluruh file `.gs`** dari folder `backend-gas/` ke project, serta `appsscript.json` ke **Project Settings > Show manifest file**.

   > `PhoneLib.gs` adalah **bundle generated** (esbuild + `google-libphonenumber`) untuk
   > normalisasi nomor HP. Jangan diedit manual — regenerasi dengan
   > `npm install && npm run bundle` di folder `backend-gas/`.

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

Di Windows PowerShell, perintah penyalinan template dapat dilakukan dengan:

```powershell
Copy-Item .env.example .env
```

### D. Login Pertama

1. **Calon murid baru** — email Google belum terdaftar → alur **registrasi siswa** (buat akun pendaftaran) → lanjut mengisi wizard 5 langkah.
2. **Admin / Guru / Panitia MPLS** — email harus terdaftar pada sheet `Admin` dengan kolom `role` yang sesuai (`admin`, `guru`, `guru_smp`, `panitia_mpls`). Tambahkan secara manual di spreadsheet (atau lewat menu **Manajemen** di dashboard admin).
3. **Guru SMP/MTs** — buka halaman **Registrasi**, pilih peran *Guru SMP/MTs*, lengkapi nama & asal sekolah → akun langsung aktif dan tersimpan pada sheet `Guru`.

## Variabel Lingkungan

| Variabel | Deskripsi |
|---|---|
| `VITE_API_URL` | URL Web App Apps Script (format `https://script.google.com/macros/s/.../exec`) |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID aplikasi Google (divalidasi sebagai `aud` token di backend) |

## Deployment Produksi

### Backend

Cara utama memakai [clasp](https://github.com/google/clasp) — `.clasp.json` di `backend-gas/` sudah berisi `scriptId` project:

```bash
cd backend-gas
npx clasp push                # unggah semua file .gs + appsscript.json
npx clasp deployments         # lihat ID deployment aktif + nomor versinya
npx clasp redeploy <deploymentId> --description "deskripsi perubahan"
```

> ⚠️ **Jangan gunakan `npx clasp deploy` untuk rilis rutin.** Perintah itu membuat
> **deployment baru dengan URL berbeda**, sedangkan `VITE_API_URL` frontend tetap menunjuk
> URL lama — akibatnya perubahan backend tidak pernah aktif di aplikasi walau sudah di-push
> (gejala klasik: "fitur baru tidak jalan" padahal kodenya benar). Gunakan `redeploy`
> (pada versi clasp lama bernama `update-deployment`) yang memindahkan **deployment yang
> sama** ke versi kode terbaru sehingga URL Web App produksi tidak berubah. Setelah
> redeploy, pastikan nomor versi pada ID deployment yang dipakai `VITE_API_URL` ikut naik.

Alternatif manual: lakukan perubahan pada project Apps Script di editor
[script.google.com](https://script.google.com), lalu **Deploy > Manage deployments > Edit > New version**.

Setiap perubahan `SHEET_ID` / `GOOGLE_CLIENT_ID` dilakukan via **Script Properties**.

### Frontend

Build produksi menghasilkan folder `dist/`, lalu diterbitkan ke **Firebase Hosting** (proyek `spmbskalzar`, konfigurasi di `firebase.json`):

```bash
cd spmb-frontend
npm run build
npx firebase deploy --only hosting
```

> Pastikan **Authorized JavaScript origins** pada OAuth Client di Cloud Console memuat URL hosting produksi Anda (mis. `https://<project-id>.web.app`).

### Validasi dan Pengujian

```bash
cd spmb-frontend
npm run lint      # ESLint
npm run test      # unit & komponen (Vitest + Testing Library)
npm run build     # typecheck (tsc -b) + build produksi Vite
npm run e2e       # end-to-end (Playwright)
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

13 sheet dibuat otomatis oleh `SheetManager.gs`:

| Sheet | Kegunaan |
|---|---|
| `Siswa` | Data registrasi calon murid (telepon ternormalisasi `628xx`, timestamp WIB) |
| `Telepon_Siswa` | Pemetaan `id_pendaftaran` → nomor HP siswa; disimpan terpisah agar selalu teks, digabung otomatis oleh API pada `getSiswa`/`updateSiswa` |
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

> **Migrasi skema otomatis** — kolom/sheet baru (mis. kolom `estimasi_penghasilan_ortu`,
> hingga sheet `Telepon_Siswa`) ditambahkan langsung ke spreadsheet yang sudah berjalan oleh
> `ensureHeaders()` saat API pertama kali dipanggil setelah `SCHEMA_VERSION` di `SheetManager.gs`
> dinaikkan (saat ini `'9'`). Data lama yang belum mengisi kolom baru dapat dilengkapi lewat
> wizard mode *final*.

## Referensi

- [Dokumentasi API Backend](backend-gas/README.md) — daftar lengkap `action` beserta contoh request
- [Dokumen Rancangan (RPD)](RPD.md) — arsitektur, skema database, dan analisis keamanan

## Lisensi

**Private / All rights reserved.** Kode pada repositori ini tidak boleh disalin, dimodifikasi, atau didistribusikan tanpa izin tertulis dari pemilik.
