import { QRCodeSVG } from 'qrcode.react'
import { QR_MODULE_COLOR, WHATSAPP_LOGO_SRC } from '../../utils/waGroup'
import { KARTU_H_MM, KARTU_W_MM } from '../../utils/kartuPrint'

export interface KartuData {
  nama: string
  email: string
  idPendaftaran: string
  jurusanLabel: string
  gelombang: string
  tahunAjaran: string
  waktuDaftar: string
  status: string
  fotoUrl?: string
  initials?: string
  linkGroupWA?: string
}

export interface BuktiPendaftaranCardProps {
  data: KartuData
  id?: string
  className?: string
}

const QR_SIZE_PX = 83
const QR_LOGO_PX = 24

export default function BuktiPendaftaranCard({
  data,
  id,
  className = '',
}: BuktiPendaftaranCardProps) {
  const linkGroupWa = (data.linkGroupWA || '').trim()
  const hasWaLink = linkGroupWa !== ''

  const rows = [
    { label: 'Program Keahlian', value: data.jurusanLabel || '-' },
    { label: 'Gelombang', value: data.gelombang || '-' },
    { label: 'Tahun Ajaran', value: data.tahunAjaran || '-' },
    { label: 'Waktu Daftar', value: data.waktuDaftar || '-' },
    { label: 'Status', value: data.status || '-' },
  ]

  return (
    <div
      id={id}
      style={{
        width: `${KARTU_W_MM}mm`,
        height: `${KARTU_H_MM}mm`,
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      }}
      className={`kartu flex flex-col overflow-hidden rounded-2xl bg-slate-800 text-white shadow-xl print:rounded-none print:shadow-none p-[3mm] ${className}`}
    >
      <div className="flex items-start justify-between gap-[2mm]">
        <div className="flex items-center gap-[2mm]">
          <img
            src="/logo.svg"
            alt="Logo"
            className="w-[7mm] h-[7mm] shrink-0 brightness-0 invert"
          />
          <div className="min-w-0">
            <p className="text-[5.5pt] font-medium uppercase tracking-[0.16em] text-brand-green-light leading-[1.4]">
              SMKS AL AZHAR SEMPU
            </p>
            <p className="text-[8pt] font-bold leading-[1.3]">Bukti Pendaftaran Resmi</p>
          </div>
        </div>
      </div>

      <div className="mt-[2mm] flex items-center gap-[2.5mm]">
        <div className="flex h-[15mm] w-[15mm] shrink-0 items-center justify-center overflow-hidden rounded-full border-[0.4mm] border-white/20 bg-slate-700">
          {data.fotoUrl ? (
            <img
              src={data.fotoUrl}
              alt="Foto"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[10pt] font-bold text-slate-400">
              {(data.initials || data.nama || '?').charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[9pt] font-bold leading-[1.35]">{data.nama || '-'}</p>
          <p className="truncate text-[6pt] leading-[1.4] text-slate-400">{data.email || '-'}</p>
          <p className="truncate text-[6pt] font-medium leading-[1.4] text-brand-green-light">
            {data.idPendaftaran || '-'}
          </p>
        </div>
      </div>

      <div className="mt-[2mm] space-y-[1.2mm] text-[6pt]">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex justify-between gap-[2mm] leading-[1.45] ${
              i < rows.length - 1 ? 'border-b border-white/10 pb-[0.8mm]' : ''
            }`}
          >
            <span className="shrink-0 text-slate-400">{row.label}</span>
            <span className="text-right font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-start justify-center gap-[15mm] pt-[2mm]">
        <div className="flex flex-col items-center gap-[1mm]">
          <div className="rounded-[1.5mm] bg-white p-[1.2mm]">
            <QRCodeSVG
              value={hasWaLink ? linkGroupWa : data.idPendaftaran || '-'}
              size={QR_SIZE_PX}
              level={hasWaLink ? 'H' : 'L'}
              bgColor="transparent"
              fgColor={QR_MODULE_COLOR}
              title={
                hasWaLink
                  ? `Scan untuk masuk grup WhatsApp ${data.gelombang}`
                  : 'ID Pendaftaran'
              }
              imageSettings={
                hasWaLink
                  ? {
                      src: WHATSAPP_LOGO_SRC,
                      width: QR_LOGO_PX,
                      height: QR_LOGO_PX,
                      excavate: true,
                    }
                  : undefined
              }
              className="w-[22mm] h-[22mm] shrink-0"
            />
          </div>
          <p className="max-w-[22mm] text-center text-[5pt] leading-[1.3] text-slate-300">
            {hasWaLink ? `Grup WhatsApp ${data.gelombang || ''}`.trim() : 'ID Pendaftaran'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-[1mm]">
          <div className="rounded-[1.5mm] bg-white p-[1.2mm]">
            <QRCodeSVG
              value={data.idPendaftaran || '-'}
              size={QR_SIZE_PX}
              level="L"
              bgColor="transparent"
              fgColor={QR_MODULE_COLOR}
              title="Scan untuk verifikasi data pendaftaran"
              className="w-[22mm] h-[22mm] shrink-0"
            />
          </div>
          <p className="max-w-[22mm] text-center text-[5pt] leading-[1.3] text-slate-300">
            Verifikasi Data
          </p>
        </div>
      </div>
    </div>
  )
}