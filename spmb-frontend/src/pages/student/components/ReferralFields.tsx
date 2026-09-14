import { useEffect, useMemo, useState } from 'react'
import InputField from '../../../components/ui/InputField'
import { DATA_KATEGORI_REFERRAL } from '../../../data/constants'
import { api } from '../../../services/api'

const KATEGORI_GURU_INTERNAL = 'Guru SMKS AL AZHAR SEMPU'
const KATEGORI_GURU_SMP = 'Guru SMP/MTs'
const SEKOLAH_KOSONG = '(Belum diisi)'

interface GuruSmpOption {
  nama: string
  asal_sekolah: string
}

interface ReferralFieldsProps {
  kategori: string
  nama: string
  onChange: (name: 'referralKategori' | 'referralNama', value: string) => void
}

export default function ReferralFields({ kategori, nama, onChange }: ReferralFieldsProps) {
  const [guruInternal, setGuruInternal] = useState<string[]>([])
  const [guruSmp, setGuruSmp] = useState<GuruSmpOption[]>([])
  const [filterSekolah, setFilterSekolah] = useState('')
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let active = true
    api.referral
      .options()
      .then((res) => {
        if (!active) return
        if (res.status === 'ok') {
          const d = res.data as {
            guruInternal?: string[]
            guruSmp?: Array<{ nama?: string; asal_sekolah?: string }>
          }
          setGuruInternal(d.guruInternal || [])
          setGuruSmp(
            (d.guruSmp || [])
              .filter((g) => (g.nama || '').trim())
              .map((g) => ({ nama: String(g.nama).trim(), asal_sekolah: String(g.asal_sekolah || '').trim() }))
          )
        } else {
          setLoadFailed(true)
        }
      })
      .catch(() => {
        if (active) setLoadFailed(true)
      })
    return () => {
      active = false
    }
  }, [])

  const isGuruInternal = kategori === KATEGORI_GURU_INTERNAL
  const isGuruSmp = kategori === KATEGORI_GURU_SMP

  const daftarSekolah = useMemo(
    () =>
      Array.from(new Set(guruSmp.map((g) => g.asal_sekolah || SEKOLAH_KOSONG))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [guruSmp]
  )

  const guruTersaring = useMemo(
    () =>
      filterSekolah
        ? guruSmp.filter((g) => (g.asal_sekolah || SEKOLAH_KOSONG) === filterSekolah).map((g) => g.nama)
        : [],
    [guruSmp, filterSekolah]
  )

  const dropdownInternalAktif = !loadFailed && isGuruInternal && guruInternal.length > 0
  const dropdownSmpAktif = !loadFailed && isGuruSmp && guruSmp.length > 0

  const handleKategoriChange = (value: string) => {
    onChange('referralNama', '')
    setFilterSekolah('')
    onChange('referralKategori', value)
  }

  const handleSekolahChange = (value: string) => {
    onChange('referralNama', '')
    setFilterSekolah(value)
  }

  return (
    <div className="border-t border-slate-100 pt-5">
      <p className="text-sm font-semibold text-slate-700 mb-1">Referral (Opsional)</p>
      <p className="text-xs text-slate-500 mb-3">
        Tuliskan nama guru, siswa kelas XI/XII, atau alumni yang mendaftarkan atau memandu proses pendaftaran Anda
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Kategori"
          name="referralKategori"
          value={kategori}
          onChange={(e) => handleKategoriChange(e.target.value)}
          options={DATA_KATEGORI_REFERRAL}
        />
        {!isGuruSmp ? (
          dropdownInternalAktif ? (
            <InputField
              label="Nama Guru SMKS AL AZHAR SEMPU"
              name="referralNama"
              value={nama}
              onChange={(e) => onChange('referralNama', e.target.value)}
              placeholder="Pilih nama guru"
              options={guruInternal.map((n) => ({ value: n, label: n }))}
            />
          ) : (
            <InputField
              label="Nama"
              name="referralNama"
              value={nama}
              onChange={(e) => onChange('referralNama', e.target.value)}
              placeholder="Nama yang memandu pendaftaran"
            />
          )
        ) : (
          <InputField
            label="Asal Sekolah (Guru SMP/MTs)"
            name="filterSekolah"
            value={filterSekolah}
            onChange={(e) => handleSekolahChange(e.target.value)}
            placeholder="Pilih sekolah dulu"
            disabled={!dropdownSmpAktif}
            options={daftarSekolah.map((s) => ({ value: s, label: s }))}
          />
        )}
      </div>
      {isGuruSmp && (
        <div className="mt-4">
          {dropdownSmpAktif ? (
            <InputField
              label="Nama Guru SMP/MTs"
              name="referralNama"
              value={nama}
              onChange={(e) => onChange('referralNama', e.target.value)}
              placeholder={filterSekolah ? 'Pilih nama guru' : 'Pilih sekolah terlebih dahulu'}
              disabled={!filterSekolah}
              options={guruTersaring.map((n) => ({ value: n, label: n }))}
            />
          ) : (
            <InputField
              label="Nama"
              name="referralNama"
              value={nama}
              onChange={(e) => onChange('referralNama', e.target.value)}
              placeholder="Nama yang memandu pendaftaran"
            />
          )}
        </div>
      )}
    </div>
  )
}
