import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Shield, ShieldCheck, X } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { api } from '../../services/api'

interface AdminItem {
  email: string
  nama: string
  role: string
  no_telp: string
}

export default function AdminManajemen() {
  const [admins, setAdmins] = useState<AdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', nama: '', role: 'admin', no_telp: '' })

  const fetchAdmins = async () => {
    try {
      const res = await api.admin.list()
      if (res.status === 'ok') {
        setAdmins(res.data as AdminItem[])
      }
    } catch {
      alert('Gagal memuat data admin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
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
      alert('Gagal menyimpan data admin')
    }
  }

  const handleDelete = async (email: string) => {
    if (!confirm(`Yakin ingin menghapus admin ${email}?`)) return
    try {
      await api.admin.delete(email)
      fetchAdmins()
    } catch {
      alert('Gagal menghapus admin')
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Memuat data...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manajemen Admin</h1>
          <p className="text-sm text-slate-500">Kelola akun administrator</p>
        </div>
        <Button variant="primary" className="text-sm" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Tambah Admin
        </Button>
      </div>

      <div className="space-y-3">
        {admins.map((admin) => (
          <Card key={admin.email} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  admin.role === 'superadmin' ? 'bg-amber-100 text-amber-600' : 'bg-brand-green-light text-brand-green'
                }`}>
                  {admin.role === 'superadmin' ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
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
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  admin.role === 'superadmin'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-brand-green-light text-brand-green-dark'
                }`}>
                  {admin.role === 'superadmin' ? 'Superadmin' : 'Admin'}
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
          <p className="text-sm text-slate-400 text-center py-8">Belum ada admin</p>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editingEmail ? 'Edit Admin' : 'Tambah Admin'}
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
                  <option value="superadmin">Superadmin</option>
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
