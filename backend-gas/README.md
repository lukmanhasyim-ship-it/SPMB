# Backend SPMB - Google Apps Script

Backend untuk Sistem Penerimaan Murid Baru SMKS Al Azhar Sempu menggunakan Google Apps Script + Google Sheets.

## Persiapan

1. **Buat Google Sheet** baru di https://sheets.google.com
2. Catat **Sheet ID** (dari URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`)
3. Buka **Extensions > Apps Script**
4. Beri nama project: `SPMB-Backend`

## Deployment

### 1. Copy Code

Copy semua file `.gs` ke dalam project Apps Script:
- `Code.gs` → `Code.gs`
- `SheetManager.gs` → `SheetManager.gs`
- `AuthHandler.gs` → `AuthHandler.gs`
- `Security.gs` → `Security.gs`
- `SiswaHandler.gs` → `SiswaHandler.gs`
- `AdminHandler.gs` → `AdminHandler.gs`
- `ConfigHandler.gs` → `ConfigHandler.gs`
- `EngagementHandler.gs` → `EngagementHandler.gs`
- `CalendarHandler.gs` → `CalendarHandler.gs`
- `TimelineHandler.gs` → `TimelineHandler.gs`
- `MplsHandler.gs` → `MplsHandler.gs`
- `DriveHandler.gs` → `DriveHandler.gs`
- `SeedData.gs` → `SeedData.gs`
- `PhoneLib.gs` → `PhoneLib.gs` *(file **generated** — hasil bundle esbuild; regenerate dengan `npm install && npm run bundle`, jangan edit manual)*
- `appsscript.json` → `appsscript.json` (di Project Settings > Show manifest file)

> Tanpa copy-paste manual: jalankan `npm install` lalu `npm run push` (bundle + `clasp push`)
> di folder ini — syaratnya sudah `npx clasp login` dan `.clasp.json` berisi `scriptId`.

### 2. Set Script Properties

Di menu **Project Settings > Script Properties**, tambahkan:

| Key | Value |
|---|---|
| `SHEET_ID` | ID Google Sheet Anda |
| `DRIVE_FOLDER_ID` | (Opsional) Biarkan kosong, akan dibuat otomatis |
| `GOOGLE_CLIENT_ID` | Client ID frontend (`VITE_GOOGLE_CLIENT_ID` di `.env`) — dipakai validasi `aud` token Google |

### 3. Seed Data

Skema 13 sheet dan data awal (3 gelombang pendaftaran + konfigurasi sistem) dibuat
**otomatis** oleh `initializeSheets()` saat API pertama kali dipanggil — idempoten.
Fungsi `seedInitialData()` dari editor hanya diperlukan bila ingin mengisi ulang data awal.

### 4. Deploy sebagai Web App

1. Klik **Deploy > New Deployment**
2. Pilih type: **Web app**
3. Set:
   - **Execute as**: `Me` (user deploying)
   - **Who has access**: `Anyone`
4. Klik **Deploy**
5. **Copy URL** yang muncul (format: `https://script.google.com/macros/s/.../exec`)

### Alternatif: Deploy via clasp

Repositori ini sudah terhubung ke project Apps Script melalui `.clasp.json`
(`scriptId` terisi). Untuk mengunggah perubahan kode tanpa copy-paste manual:

```bash
# prasyarat sekali: npx clasp login && npm install
cd backend-gas
npm run push                  # bundle PhoneLib.gs + unggah semua file .gs + appsscript.json
npx clasp deployments         # lihat ID deployment aktif + nomor versinya
npx clasp redeploy <deploymentId> --description "deskripsi perubahan"
```

> ⚠️ Hindari `npx clasp deploy` untuk rilis rutin — perintah itu membuat **deployment baru
> dengan URL berbeda** sehingga `VITE_API_URL` frontend tetap menunjuk versi lama dan
> perubahan tidak pernah aktif. `redeploy` (pada versi clasp lama bernama
> `update-deployment`) memindahkan deployment **yang sama** ke versi kode terbaru, sehingga
> URL Web App produksi tidak berubah dan frontend tidak perlu ganti `VITE_API_URL`.
> Script properties (`SHEET_ID`, `GOOGLE_CLIENT_ID`) tetap diatur lewat Project Settings.

## Konfigurasi Frontend

1. Buka `spmb-frontend/.env`
2. Set `VITE_API_URL` dengan URL web app yang didapat:

```
VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

3. Jalankan ulang frontend: `npm run dev`

## Struktur API

Semua request menggunakan `POST` dengan JSON body berisi field `action`.
Setiap aksi **wajib menyertakan token sesi** (`token`) yang didapat dari `auth`/`register`,
kecuali `auth`, `register`, dan `setup`.

> ⚠️ Keamanan: sejak versi ini, **login tidak bisa lagi menggunakan email polos**.
> Setiap login/daftar harus mengirim `idToken` (access token Google dari GIS).
> Aksi admin/staf diotorisasi oleh role di server, bukan sekadar guard UI.

### Auth
- **action: `auth`** — Login/cek role (wajib `idToken` Google)
  ```json
  { "action": "auth", "idToken": "ya29...." }
  ```
  → Mengembalikan `role`, `user`, dan `sessionToken` (untuk `guru_smp`, `user` menyertakan `asal_sekolah`).
- **action: `register`** — Registrasi siswa baru (wajib `idToken`, email harus sama dengan email di token)
  ```json
  { "action": "register", "idToken": "ya29....", "email": "...", "nama": "..." }
  ```
- **Pendaftaran mandiri Guru SMP/MTs** — kirim `registerAs: "guru_smp"` pada action `register`
  (nilai lain diabaikan; hanya `guru_smp` yang bisa didaftarkan mandiri). Data disimpan ke sheet
  **Guru** (bukan Admin), langsung aktif, wajib menyertakan `asal_sekolah`, dan
  opsional menyertakan `no_telp`:
  ```json
  { "action": "register", "idToken": "ya29....", "email": "...", "nama": "...", "registerAs": "guru_smp", "no_telp": "08...", "asal_sekolah": "SMP Negeri 1 Sempu" }
  ```

### Contoh request terautentikasi
```json
{ "action": "getEvents", "token": "<sessionToken>" }
```

Catatan: `setup` hanya berfungsi **sekali** (saat `SHEET_ID` belum di-set).
Untuk mengubah spreadsheet tujuan, ubah manual lewat Script Properties.

### Role & Otorisasi

Role yang dikenal server: `siswa`, `admin`, `guru`, `guru_smp`, `panitia_mpls`.
Nilai role tak-dikenal akan **ditolak** saat tambah/update user lewat `addAdmin`/`updateAdmin`.

- **`admin`** — akses penuh: kelola siswa, kelola user, gelombang, config, timeline, broadcast
- **`guru`** / **`guru_smp`** — baca data siswa (`getSiswa`), daftarkan siswa baru
  (`adminRegisterSiswa`), lihat statistik referral (`getReferralStats`).
  **Khusus `guru_smp`:** `getSiswa` hanya mengembalikan siswa yang kolom
  `asal_sekolah`-nya cocok (case-insensitive) dengan `asal_sekolah` akun guru pada
  sheet **Guru** — berlaku juga untuk permintaan per-email. Jika akun guru belum
  memiliki `asal_sekolah`, hasil selalu kosong. Tujuan: hindari persaingan antar
  sekolah dan memudahkan guru memantau pendaftar dari sekolahnya sendiri.
  Saat `guru_smp` mendaftarkan siswa (`adminRegisterSiswa`), `asal_sekolah` siswa
  otomatis ditimpa dengan milik akun gurunya bila terisi; jika belum ada, input
  manual dari formulir dipakai.
- **`panitia_mpls`** — baca data siswa, broadcast, dan seluruh aksi MPLS
- **`siswa`** — hanya data miliknya sendiri

> Saat role `guru`/`guru_smp` memanggil `adminRegisterSiswa`, kolom referral yang
> kosong diisi otomatis dari akun: kategori `Guru SMKS AL AZHAR SEMPU` (guru) /
> `Guru SMP/MTs` (guru_smp), nama = nama akun pada sheet Admin. Input eksplisit
> tidak ditimpa.


### Siswa
- **action: `getSiswa`** — Ambil data siswa (dengan email) atau semua (tanpa email).
  Role `guru_smp` otomatis dibatasi pada siswa satu asal sekolah (lihat bagian Role)
- **action: `updateSiswa`** — Update data siswa
  ```json
  { "action": "updateSiswa", "email": "...", "nama_lengkap": "...", ... }
  ```
- **action: `adminRegisterSiswa`** — Staf mendaftarkan siswa baru. Untuk role `guru_smp`,
  `asal_sekolah` dan referral otomatis dari akun gurunya (lihat bagian Role & Otorisasi)

Field opsional yang diterima kedua aksi di atas mengikuti kolom sheet **Siswa**
(data diri, alamat + koordinat, orang tua/wali, prestasi, referral, status), termasuk
`estimasi_penghasilan_ortu` — dropdown rentang penghasilan orang tua/wali per bulan
dengan nilai valid:

| Nilai |
|---|
| `< Rp. 500.000,-` |
| `Rp. 500.000,- s/d Rp. 1.000.000,-` |
| `Rp. 1.000.000,- s/d Rp. 5.000.000` |
| `> Rp. 5.000.000,-` |

Nilai ini diisi wajib oleh wizard finalisasi siswa dan form pendaftaran manual
admin/guru, lalu ikut tercetak pada Bagian D formulir pendaftaran.

#### Nomor Telepon & Sheet `Telepon_Siswa`

`telepon_siswa`, `telepon_ortu` (siswa) dan `no_telp` (Guru SMP/MTs) dinormalisasi otomatis di
server ke format internasional Indonesia (`0812…`/`+62812…`/`812…` → `62812…`) menggunakan
paket `google-libphonenumber` (bundle: `PhoneLib.gs`), dengan fallback regex bila library gagal
dimuat.

Nomor HP siswa (`telepon_siswa`) disimpan pada sheet terpisah **`Telepon_Siswa`**
(kolom `id_pendaftaran`, `telepon`) agar konsisten tersimpan sebagai teks. API tetap
transparan: `getSiswa` menggabungkan nilainya ke respons (per-email maupun daftar), sementara
`updateSiswa`/`adminRegisterSiswa` menuliskannya kembali. Update dengan nilai kosong **tidak**
menimpa nilai lama (mencegah race condition antar request wizard), dan barisnya ikut terhapus
saat siswa dihapus.

### Referral
- **action: `getReferralOptions`** — Opsi dropdown referral pada formulir siswa:
  `guruInternal` (daftar nama dari sheet `Admin`) dan `guruSmp`
  (`{nama, asal_sekolah}` dari sheet `Guru`) — tanpa email/telepon.
  Kategori *Guru SMP/MTs* difilter dulu per asal sekolah di sisi frontend
- **action: `getReferralStats`** — Rekap jumlah pendaftar per referral

### Gelombang
- **action: `getGelombang`** — Ambil semua gelombang
- **action: `updateGelombang`** — Update/tambah gelombang

### Config
- **action: `getConfig`** — Ambil konfigurasi sistem
- **action: `updateConfig`** — Update konfigurasi

### Broadcast
- **action: `getEvents`** — Riwayat notifikasi
- **action: `sendBroadcast`** — Kirim notifikasi baru

### Admin & Manajemen Pengguna (khusus admin)
- **action: `getAdminList` / `addAdmin` / `updateAdmin` / `deleteAdmin`** — Kelola akun staf pada sheet `Admin` (role: `admin`, `guru`, `guru_smp`, `panitia_mpls`)
- **action: `getGuruList` / `deleteGuru`** — Lihat & hapus akun Guru SMP/MTs hasil registrasi mandiri pada sheet `Guru`

### MPLS (Panitia MPLS)
- **action: `mplsLookupById`** — Cari siswa berdasarkan `id_pendaftaran`
  ```json
  { "action": "mplsLookupById", "id_pendaftaran": "SPMB-2627-G1-89CA2" }
  ```
- **action: `mplsAddKehadiran`** — Catat kehadiran siswa (absensi scan barcode)
  ```json
  { "action": "mplsAddKehadiran", "id_pendaftaran": "SPMB-2627-G1-89CA2", "scan_oleh": "Panitia MPLS" }
  ```
- **action: `mplsGetKehadiran`** — Ambil daftar kehadiran (opsional filter `tanggal` yyyy-MM-dd)

### Upload
- **action: `upload`** — Upload file ke Google Drive
  ```json
  { "action": "upload", "fileName": "foto.jpg", "fileData": "<base64>", "mimeType": "image/jpeg" }
  ```

## Google Sheets Structure

13 sheet dibuat otomatis:
- **Siswa** — Data pendaftaran siswa: identitas (nama, NISN/NIK, lahir, agama), alamat +
  koordinat peta, orang tua/wali (nama, pekerjaan, telepon ternormalisasi `628xx`,
  `estimasi_penghasilan_ortu`), prestasi, referral, serta gelombang / tahun ajaran /
  status pendaftaran; timestamp (`waktu_daftar`, `created_at`, `updated_at`) berformat WIB
- **Telepon_Siswa** — Pemetaan `id_pendaftaran` → nomor HP siswa (teks murni); digabung
  otomatis oleh `getSiswa` dan ditulis oleh `updateSiswa`/`adminRegisterSiswa`
- **Admin** — Akun staf (admin/guru/guru_smp/panitia_mpls) yang dibuat oleh admin via panel
- **Guru** — Pendaftaran mandiri Guru SMP/MTs dari halaman registrasi (email, nama, role, no_telp, created_at, asal_sekolah)
- **Pengaturan_Gelombang** — Konfigurasi gelombang
- **Sistem_Config** — Key-value config
- **Informasi_Event** — Riwayat broadcast
- **Event_Like** / **Event_Komentar** — Interaksi feed pengumuman
- **Event_Pengingat** — Pengingat Google Calendar per pengguna
- **Kehadiran_MPLS** — Log absensi siswa baru (scan barcode bukti pendaftaran)
- **Izin_MPLS** — Catatan izin peserta MPLS
- **Timeline_SPMB** — Tahapan kegiatan SPMB

> Login: role dicari berurutan di sheet **Admin → Guru → Siswa**, sehingga akun guru
> hasil pendaftaran mandiri otomatis dikenali saat login.
