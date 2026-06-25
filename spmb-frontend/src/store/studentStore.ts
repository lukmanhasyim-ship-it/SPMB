import { create } from 'zustand'
import type { DataSiswa, StepInfo } from '../types'
import { api } from '../services/api'

const STEPS: StepInfo[] = [
  { nomor: 1, label: 'Jurusan', selesai: false },
  { nomor: 2, label: 'Data Pribadi', selesai: false },
  { nomor: 3, label: 'Alamat & Peta', selesai: false },
]

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
}

function mapApiToData(apiData: Record<string, unknown>): DataSiswa {
  return {
    idPendaftaran: String(apiData.id_pendaftaran || ''),
    email: String(apiData.email || ''),
    pilihanJurusan: (String(apiData.pilihan_jurusan || '') as DataSiswa['pilihanJurusan']),
    pilihanAlternatif: (String(apiData.pilihan_alternatif || '') as DataSiswa['pilihanAlternatif']),
    alasanPilihJurusan: String(apiData.alasan_pilih_jurusan || ''),
    namaLengkap: String(apiData.nama_lengkap || ''),
    jenisKelamin: (String(apiData.jenis_kelamin || '') as DataSiswa['jenisKelamin']),
    nisn: String(apiData.nisn || ''),
    nik: String(apiData.nik || ''),
    tempatLahir: String(apiData.tempat_lahir || ''),
    tanggalLahir: String(apiData.tanggal_lahir || ''),
    agama: (String(apiData.agama || '') as DataSiswa['agama']),
    asalSekolah: String(apiData.asal_sekolah || ''),
    dusun: String(apiData.dusun || ''),
    rtRw: String(apiData.rt_rw || ''),
    desa: String(apiData.desa || ''),
    kecamatan: String(apiData.kecamatan || ''),
    kabupaten: String(apiData.kabupaten || ''),
    kodePos: String(apiData.kode_pos || ''),
    koordinatMaps: String(apiData.koordinat_maps || ''),
    tinggalBersama: (String(apiData.tinggal_bersama || '') as DataSiswa['tinggalBersama']),
    namaAyah: String(apiData.nama_ayah || ''),
    kerjaAyah: String(apiData.kerja_ayah || ''),
    namaIbu: String(apiData.nama_ibu || ''),
    kerjaIbu: String(apiData.kerja_ibu || ''),
    teleponOrtu: String(apiData.telepon_ortu || ''),
    fotoProfilBase64: String(apiData.foto_profil_url || ''),
    berkasPdfBase64: String(apiData.berkas_pdf_url || ''),
    prestasi: String(apiData.prestasi || ''),
    gelombang: (String(apiData.gelombang || '') as DataSiswa['gelombang']),
    tahunAjaran: String(apiData.tahun_ajaran || ''),
    statusPendaftaran: (apiData.status_pendaftaran as DataSiswa['statusPendaftaran']) || 'Draft',
    waktuDaftar: String(apiData.waktu_daftar || ''),
  }
}

function mapDataToApi(data: DataSiswa): Record<string, unknown> {
  return {
    pilihan_jurusan: data.pilihanJurusan,
    pilihan_alternatif: data.pilihanAlternatif,
    alasan_pilih_jurusan: data.alasanPilihJurusan,
    nama_lengkap: data.namaLengkap,
    jenis_kelamin: data.jenisKelamin,
    nisn: data.nisn,
    nik: data.nik,
    tempat_lahir: data.tempatLahir,
    tanggal_lahir: data.tanggalLahir,
    agama: data.agama,
    asal_sekolah: data.asalSekolah,
    dusun: data.dusun,
    rt_rw: data.rtRw,
    desa: data.desa,
    kecamatan: data.kecamatan,
    kabupaten: data.kabupaten,
    kode_pos: data.kodePos,
    koordinat_maps: data.koordinatMaps,
    tinggal_bersama: data.tinggalBersama,
    nama_ayah: data.namaAyah,
    kerja_ayah: data.kerjaAyah,
    nama_ibu: data.namaIbu,
    kerja_ibu: data.kerjaIbu,
    telepon_ortu: data.teleponOrtu,
    prestasi: data.prestasi,
    status_pendaftaran: data.statusPendaftaran,
  }
}

interface StudentState {
  data: DataSiswa
  steps: StepInfo[]
  loading: boolean
  error: string | null

  loadSiswa: (email: string) => Promise<void>
  updateData: (partial: Partial<DataSiswa>) => void
  saveToApi: () => Promise<void>
  completeStep: (nomor: number) => void
  selesaikanPendaftaranAwal: () => void
  finalisasi: () => void
  reset: () => void
  getCurrentStep: () => number
  getProgressPercent: () => number
}

export const useStudentStore = create<StudentState>((set, get) => ({
  data: { ...initialState },
  steps: STEPS.map((s) => ({ ...s })),
  loading: false,
  error: null,

  loadSiswa: async (email: string) => {
    set({ loading: true, error: null })
    try {
      const result = await api.siswa.get(email)

      if (result.status === 'ok') {
        const apiData = result.data as Record<string, unknown>
        const mapped = mapApiToData(apiData)

        const completedSteps: number[] = []
        if (mapped.pilihanJurusan) completedSteps.push(1)
        if (mapped.namaLengkap) completedSteps.push(2)
        if (mapped.dusun) completedSteps.push(3)

        set({
          data: mapped,
          steps: STEPS.map((s) => ({
            ...s,
            selesai: completedSteps.includes(s.nomor),
          })),
          loading: false,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data'
      set({ loading: false, error: message })
    }
  },

  updateData: (partial: Partial<DataSiswa>) => {
    set((state) => ({
      data: { ...state.data, ...partial },
    }))
  },

  saveToApi: async () => {
    const { data } = get()
    if (!data.email) return

    set({ loading: true, error: null })
    try {
      const apiData = mapDataToApi(data)
      await api.siswa.update(data.email, apiData)
      set({ loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan data'
      set({ loading: false, error: message })
    }
  },

  completeStep: (nomor: number) => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.nomor === nomor ? { ...s, selesai: true } : s
      ),
    }))

    const { data } = get()
    if (data.email) {
      const apiData = mapDataToApi(get().data)
      api.siswa.update(data.email, apiData).catch(() => {})
    }
  },

  selesaikanPendaftaranAwal: async () => {
    set((state) => ({
      steps: state.steps.map((s) =>
        s.nomor <= 3 ? { ...s, selesai: true } : s
      ),
      data: {
        ...state.data,
        statusPendaftaran: 'Terdaftar' as const,
      },
    }))

    const { data } = get()
    if (data.email) {
      await api.siswa.update(data.email, {
        status_pendaftaran: 'Terdaftar',
        ...mapDataToApi(get().data),
      })
    }
  },

  finalisasi: async () => {
    set((state) => ({
      data: {
        ...state.data,
        statusPendaftaran: 'Selesai' as const,
        waktuDaftar: new Date().toISOString(),
      },
    }))

    const { data } = get()
    if (data.email) {
      await api.siswa.update(data.email, {
        status_pendaftaran: 'Selesai',
        ...mapDataToApi(get().data),
      })
    }
  },

  reset: () => {
    set({
      data: { ...initialState },
      steps: STEPS.map((s) => ({ ...s })),
      error: null,
    })
  },

  getCurrentStep: () => {
    const { steps } = get()
    const firstIncomplete = steps.find((s) => !s.selesai)
    return firstIncomplete?.nomor || 3
  },

  getProgressPercent: () => {
    const { steps } = get()
    const completed = steps.filter((s) => s.selesai).length
    return Math.round((completed / steps.length) * 100)
  },
}))
