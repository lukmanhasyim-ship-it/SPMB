import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()
  const [internalLoading, setInternalLoading] = useState(false)

  const isLoading = loading || internalLoading

  const handleGoogleClick = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gis = (window as any).google?.accounts?.oauth2
    if (!gis) {
      console.error('GIS library not loaded yet')
      return
    }

    setInternalLoading(true)

    const cb = async (response: Record<string, unknown>) => {
      const accessToken = response.access_token as string | undefined
      if (!accessToken) {
        console.error('No access_token received')
        setInternalLoading(false)
        return
      }

      try {
        const userRes = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          { headers: { Authorization: `Bearer ${accessToken}` } },
        )
        if (!userRes.ok) {
          throw new Error('Failed to fetch user info')
        }
        const userInfo = await userRes.json()

        const email = userInfo.email as string
        const nama = (userInfo.name as string) || ''
        const fotoUrl = (userInfo.picture as string) || ''

        const result = await login(email, nama, fotoUrl, accessToken)

        if (result === 'admin') {
          navigate('/admin/dashboard')
        } else if (result === 'siswa') {
          navigate('/student/dashboard')
        } else {
          navigate('/register', { state: { email, nama, fotoUrl } })
        }
      } catch (err) {
        console.error('Login error:', err)
        setInternalLoading(false)
      }
    }

    const client = gis.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: cb,
      error_callback: () => { setInternalLoading(false) },
    })

    client.requestAccessToken()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center">
            <img src="/logo.svg" alt="Logo SMKS Al Azhar Sempu" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SPMB</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Penerimaan Murid Baru
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            SMKS AL AZHAR SEMPU
          </p>
        </div>

        <button
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-dark shadow-sm hover:shadow-md transition-all text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Memproses...' : 'Login dengan Google'}
        </button>

        <p className="text-xs text-slate-400 text-center mt-6">
          Login dengan akun Google Anda
        </p>
      </Card>
    </div>
  )
}
