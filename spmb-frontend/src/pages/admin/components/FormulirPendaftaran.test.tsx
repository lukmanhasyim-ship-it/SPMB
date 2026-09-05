import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FormulirPendaftaran from './FormulirPendaftaran'

describe('FormulirPendaftaran', () => {
  it('renders the template header and section labels as in the reference design', () => {
    const data = {
      tahun_ajaran: '2026/2027',
      id_pendaftaran: 'SPMB-2728-X-B36200F',
      gelombang: 'Inden',
      nama_lengkap: 'My Dolan My Blakraan',
      nama_ayah: 'Dd',
      nama_ibu: 'Us',
      jenis_kelamin: 'Laki-laki',
      agama: 'Islam',
      pilihan_jurusan: 'tkj',
      pilihan_alternatif: 'akl',
      asal_sekolah: 'SMP 1 Sempu',
      alasan_pilih_jurusan: 'Suka menghitung',
      nisn: '1234567890',
      nik: '3510203012940001',
      tempat_lahir: 'Banyuwangi',
      tanggal_lahir: '2010-07-19',
      dusun: 'Dapadan',
      rt_rw: '002/002',
      desa: 'Karangsari',
      kecamatan: 'Sempu',
      kabupaten: 'Banyuwangi',
      kode_pos: '68468',
      tinggal_bersama: 'Orang Tua',
      telepon_siswa: '6281234567788',
      telepon_ortu: '6282330295812',
      estimasi_penghasilan_ortu: 'Rp. 500.000, - sd Rp. 1.000.000,-',
      prestasi: 'juara 1 lomba melamun tingkat nasional',
      referral_kategori: 'Guru SMK AL AZHAR SEMPU',
      referral_nama: 'Imam Saroni',
    }

    const { container } = render(<FormulirPendaftaran data={data} />)

    expect(screen.getAllByRole('img', { name: /Kop surat/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/FORMULIR PENDAFTARAN/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/A. PILIHAN JURUSAN/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/B. DATA SISWA/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/C. ALAMAT TEMPAT TINGGAL/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/D. ORANG TUA \/ WALI/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/E. PRESTASI/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/F. REFERRAL/i).length).toBeGreaterThan(0)

    const formPages = Array.from(container.querySelectorAll('div')).filter((element) => {
      const style = (element as HTMLElement).style
      return style.backgroundImage.includes('/bg-formulir.png')
    })

    expect(formPages.length).toBeGreaterThanOrEqual(2)
    expect(formPages[0].style.backgroundSize).toBe('210mm 330mm')
    expect(formPages[0].style.backgroundPosition).toBe('0px 0px')
    expect(formPages[0].style.width).toBe('210mm')
    expect(formPages[0].style.height).toBe('330mm')
    expect(container.querySelector('.form-content')).not.toBeNull()
    expect(container.querySelector('#area-cetak')).not.toBeNull()
    expect(container.querySelector('.print-form-template')).not.toBeNull()
    expect(container.querySelector('#area-cetak-print')).not.toBeNull()

    const printStyle = container.querySelector('style')?.textContent || ''
    expect(printStyle).toContain('size: 210mm 330mm')
    expect(printStyle).toContain('margin: 0')
  })
})