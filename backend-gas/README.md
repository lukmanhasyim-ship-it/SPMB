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
- `SiswaHandler.gs` → `SiswaHandler.gs`
- `ConfigHandler.gs` → `ConfigHandler.gs`
- `AdminHandler.gs` → `AdminHandler.gs`
- `MplsHandler.gs` → `MplsHandler.gs`
- `DriveHandler.gs` → `DriveHandler.gs`
- `Security.gs` → `Security.gs`
- `SeedData.gs` → `SeedData.gs`
- `appsscript.json` → `appsscript.json` (di Project Settings > Show manifest file)

### 2. Set Script Properties

Di menu **Project Settings > Script Properties**, tambahkan:

| Key | Value |
|---|---|
| `SHEET_ID` | ID Google Sheet Anda |
| `DRIVE_FOLDER_ID` | (Opsional) Biarkan kosong, akan dibuat otomatis |
| `GOOGLE_CLIENT_ID` | Client ID frontend (`VITE_GOOGLE_CLIENT_ID` di `.env`) — dipakai validasi `aud` token Google |

### 3. Seed Data

Jalankan fungsi `seedInitialData()` dari editor Apps Script untuk mengisi data awal:
- 3 gelombang pendaftaran (Gelombang 1 = Aktif)
- Konfigurasi sistem (tahun ajaran, daftar email admin)

### 4. Deploy sebagai Web App

1. Klik **Deploy > New Deployment**
2. Pilih type: **Web app**
3. Set:
   - **Execute as**: `Me` (user deploying)
   - **Who has access**: `Anyone`
4. Klik **Deploy**
5. **Copy URL** yang muncul (format: `https://script.google.com/macros/s/.../exec`)

## Konfigurasi Frontend

1. Buka `D:\project\SPMB\spmb-frontend\.env`
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
  → Mengembalikan `role`, `user`, dan `sessionToken`.
- **action: `register`** — Registrasi siswa baru (wajib `idToken`, email harus sama dengan email di token)
  ```json
  { "action": "register", "idToken": "ya29....", "email": "...", "nama": "..." }
  ```

### Contoh request terautentikasi
```json
{ "action": "getEvents", "token": "<sessionToken>" }
```

Catatan: `setup` hanya berfungsi **sekali** (saat `SHEET_ID` belum di-set).
Untuk mengubah spreadsheet tujuan, ubah manual lewat Script Properties.


### Siswa
- **action: `getSiswa`** — Ambil data siswa (dengan email) atau semua (tanpa email)
- **action: `updateSiswa`** — Update data siswa
  ```json
  { "action": "updateSiswa", "email": "...", "nama_lengkap": "...", ... }
  ```

### Gelombang
- **action: `getGelombang`** — Ambil semua gelombang
- **action: `updateGelombang`** — Update/tambah gelombang

### Config
- **action: `getConfig`** — Ambil konfigurasi sistem
- **action: `updateConfig`** — Update konfigurasi

### Broadcast
- **action: `getEvents`** — Riwayat notifikasi
- **action: `sendBroadcast`** — Kirim notifikasi baru

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

4 sheet akan dibuat otomatis:
- **Siswa** — Data pendaftaran siswa
- **Pengaturan_Gelombang** — Konfigurasi gelombang
- **Sistem_Config** — Key-value config
- **Informasi_Event** — Riwayat broadcast
- **Kehadiran_MPLS** — Log absensi siswa baru (scan barcode bukti pendaftaran)
