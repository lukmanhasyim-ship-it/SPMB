import { useEffect, useState, useRef } from 'react'
import { Plus, Edit3, Trash2, Shield, School, X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'

interface AdminItem {
  email: string
  nama: string
  role: string
  no_telp: string
}

interface GuruItem {
  email: string
  nama: string
  role: string
  no_telp: string
  created_at?: string
  asal_sekolah?: string
}

export default function AdminManajemen() {
  const [admins, setAdmins] = useState<AdminItem[]>([])
  const [gurus, setGurus] = useState<GuruItem[]>([])
  const [guruLoadError, setGuruLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', nama: '', role: 'admin', no_telp: '' })
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; skipped: number; failed: number; errors: string[] } | null>(null)
  const importFileRef = useRef<HTMLInputElement>(null)

  const fetchAdmins = async () => {
    try {
      const res = await api.admin.list()
      if (res.status === 'ok') {
        setAdmins(res.data as AdminItem[])
      }
    } catch {
      alert('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }

  const fetchGurus = async () => {
    try {
      const res = await api.admin.guruList()
      if (res.status === 'ok') {
        setGurus(res.data as GuruItem[])
        setGuruLoadError(false)
      } else {
        setGuruLoadError(true)
      }
    } catch {
      setGuruLoadError(true)
    }
  }

  useEffect(() => {
    fetchAdmins()
    fetchGurus()
  }, [])

  const openAdd = () => {
    setEditingEmail(null)
    setForm({ email: '', nama: '', role: 'admin', no_telp: '' })
    setModalOpen(true)
  }

  const openEdit = (admin: AdminItem) => {
    setEditingEmail(admin.email)
    setForm({ email: admin.email, nama: admin.nama, role: admin.role, no_telp: admin.no_telp })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingEmail) {
        await api.admin.update(editingEmail, { nama: form.nama, role: form.role, no_telp: form.no_telp })
      } else {
        await api.admin.add(form.email, form.nama, form.role, form.no_telp)
      }
      setModalOpen(false)
      fetchAdmins()
    } catch {
      alert('Gagal menyimpan data pengguna')
    }
  }

  const handleDelete = async (email: string) => {
    if (!confirm(`Yakin ingin menghapus pengguna ${email}?`)) return
    try {
      await api.admin.delete(email)
      fetchAdmins()
    } catch {
      alert('Gagal menghapus pengguna')
    }
  }

  const handleDeleteGuru = async (email: string) => {
    if (!confirm(`Hapus pendaftaran guru ${email}? Akunnya tidak akan bisa login lagi.`)) return
    try {
      await api.admin.deleteGuru(email)
      fetchGurus()
    } catch {
      alert('Gagal menghapus data guru')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

      let success = 0
      let skipped = 0
      let failed = 0
      const errors: string[] = []

      for (const row of rows) {
        const emailKey = Object.keys(row).find((k) => k.toLowerCase() === 'email')
        const namaKey = Object.keys(row).find((k) => k.toLowerCase() === 'nama')
        const roleKey = Object.keys(row).find((k) => k.toLowerCase() === 'role')
        const telpKey = Object.keys(row).find((k) => k.toLowerCase() === 'no_telp' || k.toLowerCase() === 'notelepon' || k.toLowerCase() === 'telepon')

        const email = row[emailKey || '']?.toString().trim().toLowerCase() || ''
        const nama = row[namaKey || '']?.toString().trim() || ''
        const role = row[roleKey || '']?.toString().trim().toLowerCase() || 'guru'
        const no_telp = row[telpKey || '']?.toString().trim() || ''

        if (!email || !nama) {
          skipped++
          continue
        }

        try {
          const res = await api.admin.add(email, nama, role, no_telp)
          if (res.status === 'ok') {
            success++
          } else {
            skipped++
            errors.push(`${email}: ${res.message || 'Duplikat'}`)
          }
        } catch {
          failed++
          errors.push(`${email}: Gagal menyimpan`)
        }
      }

      setImportResult({ success, skipped, failed, errors })
      fetchAdmins()
    } catch {
      setImportResult({ success: 0, skipped: 0, failed: 1, errors: ['Gagal membaca file Excel'] })
    } finally {
      setImporting(false)
      if (importFileRef.current) importFileRef.current.value = ''
    }
  }

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['email', 'nama', 'role', 'no_telp'],
      ['guru1@gmail.com', 'Guru Satu', 'guru', '08123456789'],
      ['gurusmp1@gmail.com', 'Guru SMP Satu', 'guru_smp', '081212345678'],
      ['mpls1@gmail.com', 'Panitia MPLS', 'panitia_mpls', '08129876543'],
    ])
    ws['!cols'] = [
      { wch: 28 }, { wch: 20 }, { wch: 10 }, { wch: 15 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template Import User')
    XLSX.writeFile(wb, 'template-import-user.xlsx')
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manajemen User</h1>
          <p className="text-sm text-slate-500">Kelola akun pengguna</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="text-sm" onClick={() => { setImportResult(null); setImportModalOpen(true) }}>
            <Upload className="w-4 h-4" />
            Import Excel
          </Button>
          <Button variant="primary" className="text-sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Tambah User
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {admins.map((admin) => (
          <Card key={admin.email} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-green-light text-brand-green">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{admin.nama}</p>
                  <p className="text-xs text-slate-500">{admin.email}</p>
                  {admin.no_telp && (
                    <p className="text-xs text-slate-400">{admin.no_telp}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-green-light text-brand-green-dark">
                  {admin.role === 'guru' ? 'Guru' : admin.role === 'guru_smp' ? 'Guru SMP/MTs' : admin.role === 'panitia_mpls' ? 'Panitia MPLS' : 'Admin'}
                </span>
                <button
                  onClick={() => openEdit(admin)}
                  className="p-1.5 text-slate-400 hover:text-brand-green transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(admin.email)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {admins.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Belum ada pengguna</p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <School className="w-4 h-4 text-brand-green" />
          Pendaftaran Mandiri Guru SMP/MTs
          <span className="text-xs font-normal text-slate-400">({gurus.length})</span>
        </h2>
        <div className="space-y-3">
          {guruLoadError && (
            <p className="text-xs text-red-500 mb-2">Gagal memuat daftar pendaftar mandiri. Coba muat ulang halaman.</p>
          )}
          {gurus.map((guru) => (
            <Card key={guru.email} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-green-light text-brand-green">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{guru.nama}</p>
                    <p className="text-xs text-slate-500">{guru.email}</p>
                    {(guru.asal_sekolah || guru.no_telp || guru.created_at) && (
                      <p className="text-xs text-slate-400">
                        {[guru.asal_sekolah, guru.no_telp, guru.created_at].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-green-light text-brand-green-dark">
                    Guru SMP/MTs
                  </span>
                  <button
                    onClick={() => handleDeleteGuru(guru.email)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {gurus.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Belum ada pendaftar mandiri</p>
          )}
        </div>
      </div>

      {importModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Import Pengguna dari Excel</h3>
              <button onClick={() => setImportModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {!importResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-600 font-medium">Format kolom Excel:</p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1 text-[11px] text-brand-green hover:text-brand-green-dark font-medium transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download Template
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">email</span>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">nama</span>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">role</span>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">no_telp</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Kolom <span className="font-medium">role</span> opsional (default: guru, opsi lain: admin / guru_smp / panitia_mpls). Kolom <span className="font-medium">no_telp</span> juga opsional.
                  </p>
                </div>

                <label
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    importing
                      ? 'border-brand-green bg-brand-green-light/50'
                      : 'border-slate-200 hover:border-brand-green hover:bg-brand-green-light/30'
                  }`}
                >
                  {importing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
                      <span className="text-xs text-slate-500">Mengimport...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <FileSpreadsheet className="w-6 h-6 text-slate-400" />
                      <span className="text-xs text-slate-500">Klik untuk memilih file Excel</span>
                      <span className="text-[10px] text-slate-400">Format .xlsx</span>
                    </div>
                  )}
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                    className="hidden"
                    disabled={importing}
                  />
                </label>

                <Button variant="ghost" className="w-full" onClick={() => setImportModalOpen(false)} disabled={importing}>
                  Batal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-2">
                  {importResult.success > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-brand-green mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {importResult.success} pengguna berhasil ditambahkan
                    </div>
                  )}
                  {importResult.skipped > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-amber-600 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      {importResult.skipped} dilewati (duplikat/tidak valid)
                    </div>
                  )}
                  {importResult.failed > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-red-500 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      {importResult.failed} gagal
                    </div>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-100">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-[11px] text-slate-500">{err}</p>
                    ))}
                  </div>
                )}

                <Button variant="primary" className="w-full" onClick={() => setImportModalOpen(false)}>
                  Tutup
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editingEmail ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingEmail}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nama</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                >
                  <option value="admin">Admin</option>
                  <option value="guru">Guru</option>
                  <option value="guru_smp">Guru SMP/MTs</option>
                  <option value="panitia_mpls">Panitia MPLS</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">No. Telepon</label>
                <input
                  type="text"
                  value={form.no_telp}
                  onChange={(e) => setForm({ ...form, no_telp: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleSave}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
