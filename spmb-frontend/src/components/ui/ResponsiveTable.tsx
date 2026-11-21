import type { ReactNode } from 'react'

export interface ResponsiveColumn<T> {
  key: string
  header: ReactNode
  render: (row: T, index: number) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

export interface ResponsiveTableProps<T> {
  columns: ResponsiveColumn<T>[]
  data: T[]
  getRowId: (row: T, index: number) => string | number
  /** Kartu ringkas yang dipakai pada layar < 640px. */
  mobileCard: (row: T, index: number) => ReactNode
  emptyMessage?: ReactNode
  /** Label untuk pembaca layar pada tabel desktop. */
  caption?: string
  className?: string
  tableClassName?: string
  minWidth?: number
}

/**
 * Tabel yang berubah menjadi daftar kartu di layar sempit.
 * Di desktop tetap memakai tabel semantik dengan kemampuan scroll horizontal.
 */
export default function ResponsiveTable<T,>({
  columns,
  data,
  getRowId,
  mobileCard,
  emptyMessage = 'Tidak ada data.',
  caption,
  className = '',
  tableClassName = '',
  minWidth = 720,
}: ResponsiveTableProps<T>) {
  const empty = (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
      {emptyMessage}
    </div>
  )

  return (
    <div className={className}>
      <div className="space-y-3 sm:hidden">
        {data.length === 0 ? empty : data.map((row, index) => (
          <div key={getRowId(row, index)}>{mobileCard(row, index)}</div>
        ))}
      </div>

      <div className="hidden sm:block">
        {data.length === 0 ? empty : (
          <>
            <div className="dash-scroll overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className={`dash-table ${tableClassName}`} style={{ minWidth }}>
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} scope="col" className={column.headerClassName}>
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={getRowId(row, index)}>
                      {columns.map((column) => (
                        <td key={column.key} className={column.cellClassName}>
                          {column.render(row, index)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Geser ke samping untuk melihat kolom lainnya →
            </p>
          </>
        )}
      </div>
    </div>
  )
}
