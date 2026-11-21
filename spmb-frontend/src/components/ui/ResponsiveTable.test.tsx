import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ResponsiveTable, { type ResponsiveColumn } from './ResponsiveTable'

interface Siswa {
  id: string
  nama: string
  status: string
}

const data: Siswa[] = [
  { id: 'A1', nama: 'Budi', status: 'Terdaftar' },
  { id: 'B2', nama: 'Sari', status: 'Selesai' },
]

const columns: ResponsiveColumn<Siswa>[] = [
  { key: 'nama', header: 'Nama', render: (s) => s.nama },
  { key: 'status', header: 'Status', render: (s) => s.status },
]

function renderTable(overrides: Partial<Parameters<typeof ResponsiveTable<Siswa>>[0]> = {}) {
  return render(
    <ResponsiveTable
      columns={columns}
      data={data}
      getRowId={(s) => s.id}
      mobileCard={(s) => <div>Kartu {s.nama}</div>}
      caption="Daftar siswa"
      {...overrides}
    />,
  )
}

describe('ResponsiveTable', () => {
  it('menyediakan tabel semantik dengan caption dan header kolom', () => {
    renderTable()
    const table = screen.getByRole('table', { name: 'Daftar siswa' })
    expect(table).toBeInTheDocument()

    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(2)
    headers.forEach((header) => expect(header).toHaveAttribute('scope', 'col'))
    expect(headers.map((h) => h.textContent)).toEqual(['Nama', 'Status'])
    expect(screen.getAllByRole('row')).toHaveLength(3)
  })

  it('juga merender versi kartu untuk layar sempit', () => {
    renderTable()
    expect(screen.getByText('Kartu Budi')).toBeInTheDocument()
    expect(screen.getByText('Kartu Sari')).toBeInTheDocument()
  })

  it('memanggil render dengan baris dan indeks yang benar', () => {
    const renderCell = vi.fn((s: Siswa, i: number) => `${i + 1}. ${s.nama}`)
    renderTable({ columns: [{ key: 'nama', header: 'Nama', render: renderCell }] })

    expect(renderCell).toHaveBeenCalledWith(data[0], 0)
    expect(renderCell).toHaveBeenCalledWith(data[1], 1)
  })

  it('menampilkan pesan kosong di kedua tampilan', () => {
    renderTable({ data: [], emptyMessage: 'Belum ada siswa' })
    expect(screen.getAllByText('Belum ada siswa')).toHaveLength(2)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('menerapkan minWidth hanya pada tabel desktop', () => {
    const { container } = renderTable({ minWidth: 900 })
    const table = container.querySelector('table')
    expect(table).toHaveStyle({ minWidth: '900px' })
  })
})
