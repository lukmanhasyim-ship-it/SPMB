import type { DataSiswa, GelombangConfig, SistemConfig, InformasiEvent } from '../types';

export const DATA_JURUSAN = [
  { value: 'PPLG', label: 'Pengembangan Perangkat Lunak dan Gim' },
  { value: 'TJKT', label: 'Teknik Jaringan Komputer dan Telekomunikasi' },
  { value: 'TO', label: 'Teknik Otomotif' },
  { value: 'AKL', label: 'Akuntansi dan Keuangan Lembaga' },
  { value: 'Busana', label: 'Tata Busana' },
] as const;

export const DATA_AGAMA: string[] = [
  'Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu',
];

export const DATA_TINGGAL_BERSAMA: string[] = [
  'Orang Tua', 'Wali', 'Pondok',
];

export const DATA_GELOMBANG: GelombangConfig[] = [
  {
    gelombang: 'Gelombang 1',
    tanggalMulai: '2026-01-01',
    tanggalSelesai: '2026-03-31',
    linkGroupWA: 'https://chat.whatsapp.com/G1',
    status: 'Aktif',
  },
  {
    gelombang: 'Gelombang 2',
    tanggalMulai: '2026-04-01',
    tanggalSelesai: '2026-06-30',
    linkGroupWA: 'https://chat.whatsapp.com/G2',
    status: 'Non-Aktif',
  },
  {
    gelombang: 'Gelombang 3',
    tanggalMulai: '2026-07-01',
    tanggalSelesai: '2026-08-31',
    linkGroupWA: 'https://chat.whatsapp.com/G3',
    status: 'Non-Aktif',
  },
];

export const SISTEM_CONFIG: SistemConfig = {
  TAHUN_AJARAN_AKTIF: '2026/2027',
  ADMIN_EMAIL_LIST: ['panitiapmb@gmail.com', 'admin2@gmail.com'],
};

export const DATA_INFORMASI_EVENT: InformasiEvent[] = [
  {
    idEvent: 'EVT-001',
    targetGelombang: 'Semua',
    judul: 'Verifikasi Berkas Fisik',
    deskripsi: 'Harap membawa KK asli pada tanggal 10 Juli 2026',
    statusKirim: 'Sent',
  },
  {
    idEvent: 'EVT-002',
    targetGelombang: 'Gelombang 1',
    judul: 'Pengumuman Hasil Seleksi',
    deskripsi: 'Hasil seleksi akan diumumkan pada tanggal 15 April 2026',
    statusKirim: 'Sent',
  },
];

export const DATA_SISWA_DUMMY: DataSiswa[] = [
  {
    idPendaftaran: 'SPMB-2627-G1-A1B2C',
    email: 'ahmad.rizki@gmail.com',
    pilihanJurusan: 'PPLG',
    pilihanAlternatif: 'TJKT',
    alasanPilihJurusan: '',
    namaLengkap: 'Ahmad Rizki Pratama',
    jenisKelamin: 'Laki-laki',
    nisn: '1234567890',
    nik: '3501234567890001',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2008-05-12',
    agama: 'Islam',
    asalSekolah: 'SMP Negeri 1 Sempu',
    dusun: 'Jl. Raya Sempu No. 10',
    rtRw: '001/002',
    desa: 'Sempu',
    kecamatan: 'Sempu',
    kabupaten: 'Banyuwangi',
    kodePos: '68468',
    koordinatMaps: '-8.4112,114.1234',
    tinggalBersama: 'Orang Tua',
    namaAyah: 'Budi Santoso',
    kerjaAyah: 'Petani',
    namaIbu: 'Siti Aminah',
    kerjaIbu: 'Ibu Rumah Tangga',
    teleponOrtu: '081234567890',
    fotoProfilBase64: '',
    berkasPdfBase64: '',
    prestasi: 'Juara 1 OSN Matematika tingkat Kabupaten',
    gelombang: 'Gelombang 1',
    tahunAjaran: '2026/2027',
    statusPendaftaran: 'Terverifikasi',
    waktuDaftar: '2026-01-15T08:30:00Z',
  },
  {
    idPendaftaran: 'SPMB-2627-G1-D4E5F',
    email: 'siti.nurul@gmail.com',
    pilihanJurusan: 'AKL',
    pilihanAlternatif: '',
    alasanPilihJurusan: '',
    namaLengkap: 'Siti Nurul Hidayah',
    jenisKelamin: 'Perempuan',
    nisn: '1234567891',
    nik: '3501234567890002',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2008-08-20',
    agama: 'Islam',
    asalSekolah: 'SMP Negeri 2 Sempu',
    dusun: 'Jl. Melati No. 5',
    rtRw: '002/001',
    desa: 'Temuguruh',
    kecamatan: 'Sempu',
    kabupaten: 'Banyuwangi',
    kodePos: '68468',
    koordinatMaps: '-8.4212,114.1334',
    tinggalBersama: 'Orang Tua',
    namaAyah: 'Hasanudin',
    kerjaAyah: 'Guru',
    namaIbu: 'Fatimah',
    kerjaIbu: 'Guru',
    teleponOrtu: '082345678901',
    fotoProfilBase64: '',
    berkasPdfBase64: '',
    prestasi: 'Juara 2 Lomba Pidato Bahasa Inggris',
    gelombang: 'Gelombang 1',
    tahunAjaran: '2026/2027',
    statusPendaftaran: 'Selesai',
    waktuDaftar: '2026-02-10T10:00:00Z',
  },
  {
    idPendaftaran: 'SPMB-2627-G1-G7H8I',
    email: 'muhammad.ali@gmail.com',
    pilihanJurusan: 'TO',
    pilihanAlternatif: 'Busana',
    alasanPilihJurusan: '',
    namaLengkap: 'Muhammad Ali Akbar',
    jenisKelamin: 'Laki-laki',
    nisn: '',
    nik: '3501234567890003',
    tempatLahir: 'Jember',
    tanggalLahir: '2007-11-05',
    agama: 'Islam',
    asalSekolah: 'SMP Muhammadiyah Sempu',
    dusun: 'Jl. Kenanga No. 15',
    rtRw: '003/003',
    desa: 'Sempu',
    kecamatan: 'Sempu',
    kabupaten: 'Banyuwangi',
    kodePos: '68468',
    koordinatMaps: '-8.4012,114.1134',
    tinggalBersama: 'Wali',
    namaAyah: 'Achmad Fauzi',
    kerjaAyah: 'Wiraswasta',
    namaIbu: 'Maimunah',
    kerjaIbu: 'Ibu Rumah Tangga',
    teleponOrtu: '083456789012',
    fotoProfilBase64: '',
    berkasPdfBase64: '',
    prestasi: 'Juara 3 Lomba Voli tingkat Kecamatan',
    gelombang: 'Gelombang 1',
    tahunAjaran: '2026/2027',
    statusPendaftaran: 'Draft',
    waktuDaftar: '2026-03-01T14:00:00Z',
  },
];

export function generateIdPendaftaran(): string {
  const ta = SISTEM_CONFIG.TAHUN_AJARAN_AKTIF.replace('/', '');
  const gel = 'G1';
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `SPMB-${ta}-${gel}-${hex}`;
}
