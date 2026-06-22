import { create } from 'zustand';
import type { DataSiswa, StepInfo } from '../types';
import { DATA_GELOMBANG, SISTEM_CONFIG, generateIdPendaftaran } from '../data/dummy';

const STEPS: StepInfo[] = [
  { nomor: 1, label: 'Jurusan', selesai: false },
  { nomor: 2, label: 'Data Pribadi', selesai: false },
  { nomor: 3, label: 'Alamat & Peta', selesai: false },
];

const initialState: DataSiswa = {
  idPendaftaran: '',
  email: '',
  pilihanJurusan: '',
  pilihanAlternatif: '',
  alasanPilihJurusan: '',
  namaLengkap: '',
  jenisKelamin: '',
  nisn: '',
  nik: '',
  tempatLahir: '',
  tanggalLahir: '',
  agama: '',
  asalSekolah: '',
  dusun: '',
  rtRw: '',
  desa: '',
  kecamatan: '',
  kabupaten: '',
  kodePos: '',
  koordinatMaps: '',
  tinggalBersama: '',
  namaAyah: '',
  kerjaAyah: '',
  namaIbu: '',
  kerjaIbu: '',
  teleponOrtu: '',
  fotoProfilBase64: '',
  berkasPdfBase64: '',
  prestasi: '',
  gelombang: '',
  tahunAjaran: '',
  statusPendaftaran: 'Draft',
  waktuDaftar: '',
};

interface StudentState {
  data: DataSiswa;
  steps: StepInfo[];
  initRegistrasi: (email: string) => void;
  updateData: (partial: Partial<DataSiswa>) => void;
  completeStep: (nomor: number) => void;
  selesaikanPendaftaranAwal: () => void;
  finalisasi: () => void;
  reset: () => void;
  getCurrentStep: () => number;
  getProgressPercent: () => number;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  data: { ...initialState },
  steps: STEPS.map((s) => ({ ...s })),

  initRegistrasi: (email: string) => {
    const gelombangAktif = DATA_GELOMBANG.find((g) => g.status === 'Aktif');
    set({
      data: {
        ...initialState,
        idPendaftaran: generateIdPendaftaran(),
        email,
        gelombang: gelombangAktif?.gelombang || 'Gelombang 1',
        tahunAjaran: SISTEM_CONFIG.TAHUN_AJARAN_AKTIF,
        statusPendaftaran: 'Draft',
        waktuDaftar: new Date().toISOString(),
      },
      steps: STEPS.map((s) => ({ ...s })),
    });
  },

  updateData: (partial: Partial<DataSiswa>) => {
    set((state) => ({
      data: { ...state.data, ...partial },
    }));
  },

  completeStep: (nomor: number) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.nomor === nomor ? { ...s, selesai: true } : s
      ),
    }));
  },

  finalisasi: () => {
    set((state) => ({
      data: {
        ...state.data,
        statusPendaftaran: 'Selesai' as const,
        waktuDaftar: new Date().toISOString(),
      },
    }));
  },

  selesaikanPendaftaranAwal: () => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.nomor <= 3 ? { ...s, selesai: true } : s
      ),
      data: {
        ...state.data,
        statusPendaftaran: 'Terdaftar' as const,
      },
    }));
  },

  reset: () => {
    set({
      data: { ...initialState },
      steps: STEPS.map((s) => ({ ...s })),
    });
  },

  getCurrentStep: () => {
    const { steps } = get();
    const firstIncomplete = steps.find((s) => !s.selesai);
    return firstIncomplete?.nomor || 3;
  },

  getProgressPercent: () => {
    const { steps } = get();
    const completed = steps.filter((s) => s.selesai).length;
    return Math.round((completed / steps.length) * 100);
  },
}));
