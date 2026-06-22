# **RAPID PROTOTYPE DEVELOPMENT (RPD)**

## **SISTEM PENERIMAAN MURID BARU (SPMB) \- SMKS AL AZHAR SEMPU**

**Arsitektur:** Serverless & Cloud Database (Google Apps Script, Google Sheets, Google Drive, Google OAuth 2.0)

## **1\. PENDAHULUAN & PENINGKATAN ALUR SISTEM**

Dokumen RPD ini dirancang sebagai cetak biru teknis untuk sistem penerimaan murid baru di SMKS AL AZHAR SEMPU. Berbeda dengan sistem konvensional, prototipe ini mengadopsi alur kerja modern berbasis *cloud ecosystem* gratis yang meminimalisir biaya infrastruktur namun tetap mengedepankan keamanan dan kenyamanan pengguna (*user experience*).

### **Alur Autentikasi Tunggal & Pengalihan Dinamis:**

1. **Satu Gerbang Masuk (Unified Login):** Semua pengguna (Calon Siswa dan Admin/Panitia) masuk melalui tombol login Google OAuth 2.0 yang sama di halaman depan.  
2. **Identifikasi Peran Otomatis (Role Detection):** Backend secara otomatis memeriksa email pengguna terhadap daftar otorisasi Admin di database (Sistem\_Config).  
3. **Pengalihan Dinamis (Dynamic Redirect):**  
   * **Role: Siswa** \-\> Diarahkan ke Portal Pendaftaran (Form Wizard 5 langkah) untuk melengkapi profil (dengan **NISN Opsional**), memilih Kompetensi Keahlian Utama & **Keahlian Alternatif (Opsional)**, mendeteksi lokasi koordinat rumah di peta interaktif, mengunggah berkas, dan mengunduh kartu digital ber-QR Code.  
   * **Role: Admin** \-\> Diarahkan ke Dashboard Administrasi Utama untuk memantau statistik pendaftar, mengelola tabel pendaftar, mengubah Tahun Ajaran secara manual, mengonfigurasi parameter gelombang aktif secara fleksibel, serta mengirim notifikasi massal secara personal.

## **2\. ARSITEKTUR & DESAIN INTERAKSI (STATE MANAGEMENT)**

Aplikasi ini menggunakan konsep **Single Page Application (SPA)** yang responsif. Perpindahan antarmuka dikelola secara instan di sisi klien (*client-side state*) berdasarkan hasil verifikasi peran oleh backend.

                  \+-----------------------------------+  
                  |        HALAMAN LOGIN UTAMA        |  
                  |     (Satu Tombol Google Sign-In)  |  
                  \+-----------------+-----------------+  
                                    |  
                        \[ Google OAuth 2.0 Login \]  
                                    |  
                  \+-----------------v-----------------+  
                  |      BACKEND: ROLE DETECTION      |  
                  |     (Verifikasi Email di Cloud)   |  
                  \+--------+-----------------+--------+  
                           |                 |  
                   \[ Peran: Siswa \]   \[ Peran: Admin \]  
                           |                 |  
     \+---------------------v-----+     \+-----v---------------------+  
     |      PORTAL SISWA         |     |      DASHBOARD ADMIN      |  
     | \- Gelombang Banner & WA   |     | \- Statistik & Grafik      |  
     | \- Wizard 5 Langkah        |     | \- Tabel Calon Siswa       |  
     |   \* Jurusan Utama & Alt   |     | \- Kontrol TA & Gelombang  |  
     |   \* Pribadi (NISN Opsional)     | \- Broadcast Notifikasi    |  
     |   \* Alamat & Maps Pin     |     \+---------------------------+  
     |   \* Orang Tua/Wali        |  
     |   \* Berkas & Prestasi     |  
     | \- Kartu Digital QR Code   |  
     \+---------------------------+

## **3\. SKEMA DATABASE TERINTEGRASI (GOOGLE SHEETS)**

Seluruh data disimpan secara terpusat pada satu berkas Google Spreadsheet yang terbagi menjadi empat lembar kerja (*sheets*):

### **Sheet 1: Siswa (Data Registrasi Calon Siswa)**

| Nama Kolom | Tipe Data | Deskripsi |
| :---- | :---- | :---- |
| id\_pendaftaran | String (Key) | Format: SPMB-\[TA\]-\[GEL\]-\[RANDOM\_HEX\] (Cth: SPMB-2627-G1-89CA2) |
| email | String | Email Google siswa (diperoleh otomatis lewat OAuth) |
| pilihan\_jurusan | String | Kompetensi Keahlian Utama (PPLG / TJKT / TO / AKL / Busana) |
| pilihan\_alternatif | String | Kompetensi Keahlian Cadangan \- **Opsional** (PPLG / TJKT / TO / AKL / Busana / Kosong) |
| nama\_lengkap | String | Nama lengkap pendaftar (sesuai Ijazah/Akte) |
| jenis\_kelamin | String | Laki-laki / Perempuan |
| nisn | String (Optional) | NISN dari Kemendikbud (Opsional, tidak menghalangi finalisasi) |
| nik | String | Nomor Induk Kependudukan (Wajib, tepat 16 digit) |
| tempat\_lahir | String | Kabupaten/Kota kelahiran |
| tanggal\_lahir | Date | Tanggal lahir pendaftar |
| agama | String | Pilihan agama siswa |
| asal\_sekolah | String | Nama SMP/MTs asal |
| dusun | String | Nama Dusun/Jalan domisili |
| rt\_rw | String | RT / RW domisili |
| desa | String | Desa/Kelurahan domisili |
| kecamatan | String | Kecamatan domisili |
| kabupaten | String | Kabupaten/Kota domisili |
| kode\_pos | String | Kode pos domisili pendaftar |
| koordinat\_maps | String | Koordinat geografis GPS (Cth: \-8.4112,114.1234) |
| tinggal\_bersama | String | Tinggal bersama Orang Tua / Wali / Pondok |
| nama\_ayah | String | Nama Ayah kandung |
| kerja\_ayah | String | Pekerjaan Ayah kandung |
| nama\_ibu | String | Nama Ibu kandung |
| kerja\_ibu | String | Pekerjaan Ibu kandung |
| telepon\_ortu | String | Nomor WhatsApp aktif Orang Tua/Wali |
| foto\_profil\_url | String | Tautan berkas pas foto di Google Drive |
| berkas\_pdf\_url | String | Tautan berkas gabungan (KK, Akta, SKL) di Google Drive |
| prestasi | Text | Deskripsi prestasi tingkat SMP/MTs |
| gelombang | String | Gelombang saat mendaftar (Cth: Gelombang 1\) |
| tahun\_ajaran | String | Periode pendaftaran aktif (Cth: 2026/2027) |
| status\_pendaftaran | String | Status berkas: Draft / Selesai / Terverifikasi |
| waktu\_daftar | Timestamp | Waktu penyimpanan/finalisasi pendaftaran |

### **Sheet 2: Pengaturan\_Gelombang (Kontrol Dinamis oleh Admin)**

Menyimpan jadwal pembukaan gelombang, link koordinasi grup WhatsApp, serta status keaktifan yang dikelola langsung secara manual oleh Admin dari Dashboard Admin:

| Gelombang | Tanggal Mulai | Tanggal Selesai | Link Group WA | Status |
| :---- | :---- | :---- | :---- | :---- |
| Gelombang 1 | 2026-01-01 | 2026-03-31 | https://chat.whatsapp.com/G1 | Aktif |
| Gelombang 2 | 2026-04-01 | 2026-06-30 | https://chat.whatsapp.com/G2 | Non-Aktif |
| Gelombang 3 | 2026-07-01 | 2026-08-31 | https://chat.whatsapp.com/G3 | Non-Aktif |

### **Sheet 3: Sistem\_Config (Pengaturan Global & Otorisasi)**

Menyimpan variabel operasional jangka panjang dan daftar email admin yang berhak mengelola sistem:

| Key | Value | Keterangan |
| :---- | :---- | :---- |
| TAHUN\_AJARAN\_AKTIF | 2026/2027 | Diperbarui secara manual oleh admin setiap tahun ajaran baru |
| ADMIN\_EMAIL\_LIST | panitiapmb@gmail.com,admin2@gmail.com | Email yang diizinkan masuk ke Dashboard Admin |

### **Sheet 4: Informasi\_Event (Notifikasi Event Personal)**

Menyimpan rekaman notifikasi massal terintegrasi yang dikirimkan secara langsung ke email calon siswa:

| ID\_Event | Target\_Gelombang | Judul Event | Deskripsi Event | Status Kirim |
| :---- | :---- | :---- | :---- | :---- |
| EVT-001 | Semua | Verifikasi Berkas Fisik | Harap membawa KK asli pada tanggal 10 Juli | Sent |

## **4\. ANALISIS DAN MITIGASI CELAH KRITIS (SECURITY & DEPLOYMENT GAPS)**

Selama fase transisi dari prototipe menuju lingkungan produksi (*live environment*), sistem ini dilengkapi dengan proteksi berikut:

1. **Race Condition Protection (Concurrency):** Menggunakan **LockService.getPublicLock()** pada backend Apps Script. Sistem akan mengunci database Google Sheets selama maksimal 30 detik setiap kali ada siswa baru yang menekan tombol submit pendaftaran. Hal ini mencegah tumpang tindih penomoran Baris (*row collision*) dan duplikasi ID pendaftaran saat diakses bersamaan oleh ratusan pendaftar.  
2. **Client-Side File Streamlining:** Menghindari kegagalan pengiriman berkas dengan mengintegrasikan modul asinkronus fileToBase64 berbasis *Promise* di frontend. File foto (maks 2MB) dan dokumen gabungan PDF (maks 5MB) dikonversi menjadi string Base64 di browser siswa terlebih dahulu sebelum dikirim melalui skrip API, mencegah batasan kuota upload Apps Script terlampaui.  
3. **Admin Control Area Shield:** Memisahkan panel administrasi secara aman. Simulasi admin diamankan dengan autentikasi berbasis email yang cocok dengan data di database, serta visualisasi panel dashboard yang dibuat eksklusif (tidak dapat diakses oleh akun siswa).

## **5\. REVISI DESAIN INTERKASI UI/UX MODERN**

Sisi frontend dirancang menggunakan prinsip **"Clean Emerald Glassmorphism"** yang menggabungkan nuansa islami modern dengan efisiensi teknologi tinggi:

* **Sistem Form Wizard 5-Langkah:** Membagi formulir pendaftaran yang panjang menjadi bagian-bagian terpisah yang ringan untuk meminimalkan beban psikologis pendaftar (*cognitive overload*).  
* **Responsive Visual Feedback:**  
  * Indikator progres langkah (*step tracker*) di atas formulir berubah warna secara dinamis dari abu-abu menjadi hijau emerald cerah saat langkah diselesaikan.  
  * Kartu preview digital dirancang menyerupai tiket masuk VIP bertekstur gelap metalik, menampilkan foto siswa secara *real-time*, detail nama, program studi utama beserta cadangan, dan QR code pendaftaran otomatis segera setelah data disimpan.  
  * Navigasi diletakkan dalam *floating bar* semi-transparan dengan efek blur latar belakang (*glassmorphism*) yang memberikan kesan elegan.