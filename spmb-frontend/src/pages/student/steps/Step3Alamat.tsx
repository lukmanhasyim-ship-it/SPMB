import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { MapPin, Crosshair, ExternalLink, Map as MapIcon, ScanLine } from 'lucide-react'
import { useStudentStore } from '../../../store/studentStore'
import StepLayout from '../components/StepLayout'
import ScanAlamatModal from '../components/ScanAlamatModal'
import type { HasilEkstraksiAlamat } from '../../../utils/ocr'
import InputField from '../../../components/ui/InputField'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { api } from '../../../services/api'



interface Step3Props {
  onComplete: () => void
  onBack: () => void
}

const defaultPosition: [number, number] = [-8.4112, 114.1234]

export default function Step3Alamat({ onComplete, onBack }: Step3Props) {
  const { data, steps, updateData, completeStep } = useStudentStore()
  const [position, setPosition] = useState<[number, number]>(defaultPosition)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [showScan, setShowScan] = useState(false)

  const handleApplyScan = (hasil: HasilEkstraksiAlamat, arsipBase64: string) => {
    updateData({
      dusun: hasil.alamat || data.dusun,
      rtRw: hasil.rtRw || data.rtRw,
      desa: hasil.desa || data.desa,
      kecamatan: hasil.kecamatan || data.kecamatan,
      kabupaten: hasil.kabupaten || data.kabupaten,
      kodePos: hasil.kodePos || data.kodePos,
    })
    if (arsipBase64) {
      const identitas = (data.idPendaftaran || data.email || 'siswa').replace(/[^a-zA-Z0-9_-]/g, '_')
      api
        .upload(`${identitas}-dokumen-alamat.jpg`, 'image/jpeg', arsipBase64)
        .then((res) => {
          const info = res.data as { fileUrl?: string } | undefined
          if (info?.fileUrl) updateData({ dokumenAlamatUrl: info.fileUrl })
        })
        .catch(() => {})
    }
    setShowScan(false)
  }

  useEffect(() => {
    if (data.koordinatMaps) {
      const parts = data.koordinatMaps.split(',')
      if (parts.length === 2) {
        const lat = parseFloat(parts[0])
        const lng = parseFloat(parts[1])
        if (!isNaN(lat) && !isNaN(lng)) {
          setPosition([lat, lng])
        }
      }
    }
  }, [data.koordinatMaps])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateData({ [name]: value })
  }

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`
      )
      const geodata = await res.json()
      const addr = geodata.address || {}
      
      updateData({
        dusun: addr.road || addr.path || addr.dusun || addr.footway || data.dusun || '',
        desa: addr.village || addr.town || addr.neighbourhood || addr.suburb || addr.city_district || data.desa || '',
        kecamatan: addr.county || addr.district || addr.municipality || data.kecamatan || '',
        kabupaten: addr.city || addr.state_district || addr.region || addr.state || data.kabupaten || '',
        kodePos: addr.postcode || data.kodePos || '',
      })
    } catch {
      // ignore
    }
  }



  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung GPS')
      return
    }
    const isInsecure = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost'
    if (isInsecure) {
      setLocationError('Akses lokasi membutuhkan koneksi HTTPS. Gunakan localhost atau HTTPS.')
      return
    }
    setLocating(true)
    setLocationError('')
    const fetchLocation = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          setPosition([latitude, longitude])
          updateData({ koordinatMaps: `${latitude.toFixed(4)},${longitude.toFixed(4)}` })
          fetchAddress(latitude, longitude)
          setLocating(false)
        },
        (err) => {
          if (err.code === 3 && highAccuracy) {
            fetchLocation(false)
            return
          }
          setLocating(false)
          if (err.code === 1) setLocationError('Izin lokasi ditolak. Izinkan akses lokasi di browser Anda.')
          else if (err.code === 2) setLocationError('Sinyal GPS tidak tersedia. Coba di luar ruangan atau nyalakan Wi-Fi.')
          else if (err.code === 3) setLocationError('Waktu permintaan lokasi habis. Pastikan GPS/Wi-Fi aktif, lalu coba lagi.')
          else setLocationError('Gagal mengambil lokasi')
        },
        { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 15000 : 10000, maximumAge: 60000 }
      )
    }

    fetchLocation(true)
  }

  const handleNext = () => {
    if (!data.dusun || !data.desa || !data.kecamatan || !data.kabupaten) {
      alert('Lengkapi alamat (Dusun, Desa, Kecamatan, Kabupaten)')
      return
    }
    completeStep(3)
    onComplete()
  }

  const mapsOpenUrl = `https://www.google.com/maps?q=${position[0]},${position[1]}`

  return (
    <StepLayout
      title="Alamat & Titik Koordinat"
      subtitle="Lengkapi alamat domisili dan tandai lokasi rumah Anda di peta"
      steps={steps}
      currentStep={3}
      onPrevious={onBack}
      onNext={handleNext}
    >
      <div className="space-y-4">
        <Card className="p-4 border-brand-green/20">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ScanLine className="w-4 h-4 text-brand-green shrink-0" />
              <span>Isi alamat otomatis dari foto KK atau KTP orang tua</span>
            </div>
            <Button onClick={() => setShowScan(true)} className="!px-4 !py-2 text-xs">
              <ScanLine className="w-4 h-4" />
              Scan Dokumen
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Dusun/Jalan"
            name="dusun"
            value={data.dusun}
            onChange={handleChange}
            placeholder="Nama dusun atau jalan"
            required
          />
          <InputField
            label="RT / RW"
            name="rtRw"
            value={data.rtRw}
            onChange={handleChange}
            placeholder="Contoh: 001/002"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField
            label="Desa/Kelurahan"
            name="desa"
            value={data.desa}
            onChange={handleChange}
            placeholder="Desa"
            required
          />
          <InputField
            label="Kecamatan"
            name="kecamatan"
            value={data.kecamatan}
            onChange={handleChange}
            placeholder="Kecamatan"
            required
          />
          <InputField
            label="Kabupaten/Kota"
            name="kabupaten"
            value={data.kabupaten}
            onChange={handleChange}
            placeholder="Kabupaten/Kota"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Kode Pos"
            name="kodePos"
            value={data.kodePos}
            onChange={handleChange}
            placeholder="Kode pos"
          />
          <InputField
            label="Koordinat Maps"
            name="koordinatMaps"
            value={data.koordinatMaps}
            onChange={handleChange}
            placeholder="Isi manual atau gunakan tombol Lokasi Saya"
          />
        </div>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-brand-green" />
              <span>Preview lokasi rumah Anda</span>
            </div>
            <button
              onClick={handleGetLocation}
              disabled={locating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-green hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium text-white shadow-sm"
            >
              {locating ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mendeteksi...
                </>
              ) : (
                <>
                  <Crosshair className="w-3.5 h-3.5" />
                  Lokasi Saya
                </>
              )}
            </button>
          </div>
          {locationError && (
            <p className="text-xs text-red-500 mb-2">{locationError}</p>
          )}
          <div className="h-[350px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <iframe
              title="Google Maps"
              src={`https://www.google.com/maps?q=${position[0]},${position[1]}&output=embed&z=16`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <a
              href={`geo:${position[0]},${position[1]}?q=${position[0]},${position[1]}`}
              className="flex-1 flex items-center justify-center gap-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg font-medium transition-all"
            >
              <MapIcon className="w-3.5 h-3.5" />
              Buka di Aplikasi Maps (HP)
            </a>
            <a
              href={mapsOpenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 text-xs text-brand-green hover:bg-brand-green-light border border-brand-green/20 py-2.5 rounded-lg font-medium transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka di Google Maps (Web)
            </a>
          </div>
        </Card>
      </div>

      <ScanAlamatModal
        open={showScan}
        onClose={() => setShowScan(false)}
        onApply={handleApplyScan}
      />
    </StepLayout>
  )
}
