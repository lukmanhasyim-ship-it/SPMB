import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Download, Printer, FileText } from 'lucide-react'
import { isPendaftaranAwalLengkap, useStudentStore } from '../../store/studentStore'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import BuktiPendaftaranCard, { KartuData } from '../../components/kartu/BuktiPendaftaranCard'
import { DATA_JURUSAN } from '../../data/constants'
import { formatWIB } from '../../utils/dateUtils'
import { api } from '../../services/api'
import { findLinkGroupWa } from '../../utils/waGroup'
import { a4SinglePrintCss, kartuPrintCss } from '../../utils/kartuPrint'
import { useKartuPrint } from '../../hooks/useKartuPrint'

export default function KartuPendaftaran() {
  const navigate = useNavigate()
  const { data, loading, loadSiswa } = useStudentStore()
  const { user } = useAuthStore()
  const [linkGroupWa, setLinkGroupWa] = useState('')
  const { mode: printMode, print: handlePrint } = useKartuPrint()

  useEffect(() => {
    if (!data.idPendaftaran && user?.email) loadSiswa(user.email)
  }, [data.idPendaftaran, user?.email, loadSiswa])

  useEffect(() => {
    if (!loading && data.idPendaftaran && !isPendaftaranAwalLengkap(data)) {
      navigate('/student/dashboard', { replace: true })
    }
  }, [data, loading, navigate])

  useEffect(() => {
    const target = data.gelombang
    if (!target) {
      setLinkGroupWa('')
      return
    }
    let cancelled = false
    api.gelombang
      .get()
      .then((res) => {
        if (cancelled || res.status !== 'ok') return
        setLinkGroupWa(findLinkGroupWa(res.data as Array<Record<string, string>>, target))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [data.gelombang])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader />
      </div>
    )
  }

  if (!data.idPendaftaran || !isPendaftaranAwalLengkap(data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-800">Data pendaftaran belum siap</h2>
          <p className="mt-2 text-sm text-slate-500">Lengkapi data pendaftaran terlebih dahulu.</p>
          <Button onClick={() => navigate('/student/wizard?mode=awal&step=3')} className="mt-5">
            Kembali ke Formulir
          </Button>
        </Card>
      </div>
    )
  }

  const jurusanLabel = DATA_JURUSAN.find((j) => j.value === data.pilihanJurusan)?.label || data.pilihanJurusan

  const kartuData: KartuData = {
    nama: data.namaLengkap || '-',
    email: user?.email || '-',
    idPendaftaran: data.idPendaftaran,
    jurusanLabel,
    gelombang: data.gelombang,
    tahunAjaran: data.tahunAjaran || '-',
    waktuDaftar: formatWIB(data.waktuDaftar),
    status: 'Terdaftar',
    fotoUrl: data.fotoProfilBase64 || user?.fotoUrl,
    initials: data.namaLengkap || '?',
    linkGroupWA: linkGroupWa,
  }

  const css = printMode === 'kartu' ? kartuPrintCss() : a4SinglePrintCss()

  return (
    <div className="min-h-screen bg-slate-50">
      {printMode && <style>{css}</style>}

      <div className="kartu-screen-shell min-h-screen p-4 sm:p-8">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="flex min-h-touch items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green-light hover:text-brand-green-dark"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
            <h2 className="min-w-0 text-center text-base font-bold text-slate-800 sm:text-lg">
              Bukti Pendaftaran
            </h2>
            <div className="hidden w-20 sm:block" />
          </div>

          <div className="flex justify-center">
            <BuktiPendaftaranCard data={kartuData} mode="screen" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button onClick={() => handlePrint('kartu')} fullWidth variant="primary">
                <Printer className="w-4 h-4" />
                Cetak Kartu 65x95mm
              </Button>
              <Button onClick={() => handlePrint('a4')} fullWidth variant="secondary">
                <FileText className="w-4 h-4" />
                Cetak A4
              </Button>
            </div>
            <Link to="/student/wizard?mode=final">
              <Button fullWidth variant="secondary">
                <Download className="w-4 h-4" />
                Finalisasi Profile
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400">
            Ukuran kartu 65 x 95 mm. Pilih &quot;Cetak Kartu&quot; bila printer mendukung kertas custom,
            atau &quot;Cetak A4&quot; untuk printer biasa.
          </p>
        </div>
      </div>

      {printMode && (
        <div className="kartu-print-root">
          <div className="a4-sheet">
            <BuktiPendaftaranCard data={kartuData} />
          </div>
        </div>
      )}
    </div>
  )
}