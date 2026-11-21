import { ClipboardList, CreditCard, Home } from 'lucide-react'
import type { HeaderNavItem } from '../../components/layout/ResponsiveHeader'
import { isPendaftaranAwalLengkap } from '../../store/studentStore'
import type { DataSiswa } from '../../types'

/** Daftar halaman siswa yang dipakai header, sheet, dan bottom bar. */
export const studentNavItems: HeaderNavItem[] = [
  { to: '/student/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/student/wizard', icon: ClipboardList, label: 'Formulir' },
  { to: '/student/kartu-pendaftaran', icon: CreditCard, label: 'Bukti Pendaftaran' },
]

/**
 * Pintasan mengikuti progres pendaftaran. Dikembalikan kosong saat data masih
 * dimuat supaya label tidak berubah-ubah di layar kecil.
 */
export function getStudentShortcuts(data: DataSiswa, loading: boolean): HeaderNavItem[] {
  if (loading) return []

  return [
    isPendaftaranAwalLengkap(data)
      ? { ...studentNavItems[2], label: 'Lihat Kartu' }
      : { ...studentNavItems[1], label: 'Lanjut Daftar' },
  ]
}
