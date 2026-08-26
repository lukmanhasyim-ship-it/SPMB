# SPMB Frontend

Single Page Application (SPA) React untuk [SPMB — Sistem Penerimaan Murid Baru](../README.md) **SMKS Al Azhar Sempu**.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand — state management (`authStore`, `studentStore`)
- React Router — routing per peran (siswa, admin, guru, guru SMP/MTs, panitia MPLS)
- `qrcode.react` — kartu pendaftaran digital ber-QR
- `html5-qrcode` — pemindaian QR absensi MPLS
- `tesseract.js` — OCR pindaian KK/KTP untuk pengisian alamat otomatis
- `xlsx` — import & export Excel data pendaftar
- Vitest + Testing Library (unit/komponen), Playwright (e2e)

## Menjalankan

```bash
npm install
cp .env.example .env    # lalu isi VITE_API_URL & VITE_GOOGLE_CLIENT_ID
npm run dev             # buka http://localhost:5173
```

Langkah setup lengkap (backend Apps Script, OAuth Client, deployment) ada di
[README utama](../README.md).

> ⚠️ `VITE_API_URL` harus menunjuk **deployment Web App yang versinya terbaru**.
> Cek dengan `npx clasp deployments` di folder `../backend-gas/` — jika ID deployment
> pada URL belum naik versi setelah push kode, jalankan
> `npx clasp redeploy <deploymentId>` agar URL lama memakai kode terbaru.

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server Vite (HMR) |
| `npm run build` | Typecheck (`tsc -b`) + build produksi ke `dist/` |
| `npm run lint` | ESLint |
| `npm run test` | Unit & komponen (Vitest + Testing Library) |
| `npm run e2e` | End-to-end (Playwright) |

## Deploy Produksi

Build diterbitkan ke **Firebase Hosting** (proyek `spmbskalzar`, konfigurasi di `firebase.json`):

```bash
npm run build
npx firebase deploy --only hosting
```

Pastikan *Authorized JavaScript origins* pada OAuth Client di Google Cloud Console memuat
URL hosting produksi (mis. `https://<project-id>.web.app`) dan `http://localhost:5173`.

## Struktur Singkat

```
src/
├─ pages/            # login, student (wizard 5 langkah), admin, guru, mpls
├─ components/       # UI kit (Button, Card, InputField, StatCard, DonutChart, Toast, …)
├─ services/api.ts   # lapisan pemanggil API GAS (action + session token)
├─ store/            # Zustand: authStore (sesi), studentStore (data & wizard siswa)
├─ types/            # tipe TypeScript (DataSiswa, dll.)
├─ utils/            # dateUtils (konversi waktu WIB), dll.
└─ data/constants.ts # jurusan, agama, proyeksi karir, kategori referral
```
