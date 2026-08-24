export type Jurusan = 'PPLG' | 'TJKT' | 'TO' | 'AKL' | 'Busana';
export type Gelombang = 'Gelombang 1' | 'Gelombang 2' | 'Gelombang 3';
export type StatusPendaftaran = 'Draft' | 'Terdaftar' | 'Selesai' | 'Terverifikasi';
export type Role = 'siswa' | 'admin' | 'guru' | 'guru_smp' | 'panitia_mpls' | 'new';
export type TinggalBersama = 'Orang Tua' | 'Wali' | 'Pondok';
export type Agama = 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';
export type JenisKelamin = 'Laki-laki' | 'Perempuan';
export type KategoriReferral = 'Guru SMKS AL AZHAR SEMPU' | 'Guru SMP/MTs' | 'Siswa Kelas X' | 'Siswa Kelas XI' | 'Siswa Kelas XII' | 'Alumni' | 'Lainnya';

export interface User {
  email: string;
  nama: string;
  role: Role;
  fotoUrl?: string;
  asal_sekolah?: string;
}

export interface DataSiswa {
  idPendaftaran: string;
  email: string;
  pilihanJurusan: Jurusan | '';
  pilihanAlternatif: Jurusan | '';
  alasanPilihJurusan: string;
  namaLengkap: string;
  jenisKelamin: JenisKelamin | '';
  nisn: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Agama | '';
  asalSekolah: string;
  dusun: string;
  rtRw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  kodePos: string;
  koordinatMaps: string;
  dokumenAlamatUrl: string;
  tinggalBersama: TinggalBersama | '';
  namaAyah: string;
  kerjaAyah: string;
  namaIbu: string;
  kerjaIbu: string;
  teleponOrtu: string;
  fotoProfilBase64: string;
  berkasPdfBase64: string;
  prestasiFotoBase64: string;
  prestasi: string;
  referralNama: string;
  referralKategori: KategoriReferral | '';
  gelombang: Gelombang | '';
  tahunAjaran: string;
  statusPendaftaran: StatusPendaftaran;
  waktuDaftar: string;
}

export interface GelombangConfig {
  gelombang: Gelombang;
  tanggalMulai: string;
  tanggalSelesai: string;
  linkGroupWA: string;
  status: 'Aktif' | 'Non-Aktif';
}

export interface SistemConfig {
  TAHUN_AJARAN_AKTIF: string;
  ADMIN_EMAIL_LIST: string[];
}

export interface InformasiEvent {
  idEvent: string;
  targetGelombang: string;
  judul: string;
  deskripsi: string;
  gambarUrl: string;
  tanggalPelaksanaan: string;
  waktuPelaksanaan: string;
  tempatPelaksanaan: string;
  statusKirim: string;
  createdAt: string;
}

export interface StepInfo {
  nomor: number;
  label: string;
  selesai: boolean;
}

export interface KehadiranMpls {
  id_kehadiran: string;
  id_pendaftaran: string;
  nama_lengkap: string;
  email: string;
  jurusan: string;
  gelombang: string;
  tanggal: string;
  jam: string;
  keterangan?: string;
  scan_oleh: string;
  created_at: string;
}

export interface IzinMpls {
  id_izin: string;
  id_pendaftaran: string;
  nama_lengkap: string;
  email: string;
  jurusan: string;
  gelombang: string;
  tanggal: string;
  jenis_izin: string;
  catatan?: string;
  diinput_oleh: string;
  created_at: string;
}
