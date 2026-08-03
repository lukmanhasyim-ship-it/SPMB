import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Users, GraduationCap } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Loader from '../../components/ui/Loader'
import { api } from '../../services/api'

export default function GuruDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [totalSiswa, setTotalSiswa] = useState(0)
  const [jurusanCounts, setJurusanCounts] = useState<Record<string, number>>({})
  const [gelombangCounts, setGelombangCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.siswa.getAll()
        if (res.status === 'ok') {
          const list = res.data as Array<Record<string, string>>
          setTotalSiswa(list.length)

          const jurusan: Record<string, number> = {}
          const gelombang: Record<string, number> = {}
          list.forEach((s) => {
            if (s.pilihan_jurusan) {
              jurusan[s.pilihan_jurusan] = (jurusan[s.pilihan_jurusan] || 0) + 1
            }
            if (s.gelombang) {
              gelombang[s.gelombang] = (gelombang[s.gelombang] || 0) + 1
            }
          })
          setJurusanCounts(jurusan)
          setGelombangCounts(gelombang)
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{user?.nama}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Statistik Pendaftaran</h1>
          <p className="text-sm text-slate-500">Ringkasan data pendaftar SPMB</p>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalSiswa}</p>
                  <p className="text-xs text-slate-500">Total Pendaftar</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Jumlah Per Program Keahlian
              </h3>
              <div className="space-y-3">
                {Object.entries(jurusanCounts).length > 0 ? (
                  Object.entries(jurusanCounts).map(([jurusan, count]) => {
                    const percent = totalSiswa > 0 ? Math.round((count / totalSiswa) * 100) : 0
                    return (
                      <div key={jurusan}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium">{jurusan}</span>
                          <span className="text-slate-500">{count} siswa</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-green rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-slate-400">Belum ada data</p>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Jumlah Per Gelombang
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(gelombangCounts).length > 0 ? (
                  Object.entries(gelombangCounts).map(([gelombang, count]) => (
                    <div key={gelombang} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <p className="text-lg font-bold text-slate-800">{count}</p>
                      <p className="text-xs text-slate-500">{gelombang}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 col-span-full">Belum ada data</p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
