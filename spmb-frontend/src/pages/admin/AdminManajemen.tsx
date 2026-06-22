import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { api } from '../../services/api'
import Card from '../../components/ui/Card'

interface AdminUser {
  email: string
  nama_lengkap: string
  role: string
  no_telepon: string
  created_at: string
}

export default function AdminManajemen() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmail, setEditingEmail] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', nama: '', role: 'admin', no_telepon: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const result = await api.admin.getAll()
      setAdmins(result.data as AdminUser[])
    } catch (err) {
      console.error('Failed to load admins:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditingEmail(null)
    setForm({ email: '', nama: '', role: 'admin', no_telepon: '' })
    setShowModal(true)
  }

  const openEdit = (admin: AdminUser) => {
    setEditingEmail(admin.email)
    setForm({ email: admin.email, nama: admin.nama_lengkap, role: admin.role, no_telepon: admin.no_telepon })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingEmail) {
        const data: Record<string, unknown> = {}
        if (form.nama) data.nama = form.nama
        if (form.role) data.role = form.role
        if (form.no_telepon !== undefined) data.no_telepon = form.no_telepon
        await api.admin.update(editingEmail, data)
      } else {
        await api.admin.add(form.email, form.nama, form.role, form.no_telepon)
      }
      setShowModal(false)
      await loadAdmins()
    } catch (err) {
      console.error('Failed to save admin:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (email: string) => {
    if (!confirm(`Hapus admin ${email}?`)) return
    try {
      await api.admin.remove(email)
      await loadAdmins()
    } catch (err) {
      console.error('Failed to delete admin:', err)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manajemen Admin</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola pengguna yang memiliki akses panel administrasi</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Admin
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Nama</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Telepon</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Belum ada admin
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.email} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{admin.email}</td>
                    <td className="px-4 py-3 text-slate-600">{admin.nama_lengkap}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        admin.role === 'superadmin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{admin.no_telepon || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(admin)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.email)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingEmail ? 'Edit Admin' : 'Tambah Admin'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingEmail}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="admin@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  placeholder="Nama admin"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">No. Telepon</label>
                <input
                  type="tel"
                  value={form.no_telepon}
                  onChange={(e) => setForm({ ...form, no_telepon: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.email || !form.nama}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark disabled:opacity-50 text-sm font-medium text-white transition-all"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                  {!saving && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
