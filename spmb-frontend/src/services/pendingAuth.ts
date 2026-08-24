const PENDING_KEY = 'spmb.pending-registration'
const MAX_AGE_MS = 30 * 60 * 1000

export interface PendingRegistration {
  email: string
  nama: string
  fotoUrl: string
  token: string
  createdAt: number
}

export interface PendingRegistrationResult {
  data: PendingRegistration
  expired: boolean
}

export function setPendingRegistration(data: Omit<PendingRegistration, 'createdAt'>): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ ...data, createdAt: Date.now() }))
  } catch {
    /* noop */
  }
}

export function readPendingRegistration(): PendingRegistrationResult | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingRegistration
    if (!parsed || !parsed.email || !parsed.token) {
      clearPendingRegistration()
      return null
    }
    const expired = Date.now() - (parsed.createdAt || 0) > MAX_AGE_MS
    if (expired) clearPendingRegistration()
    return { data: parsed, expired }
  } catch {
    clearPendingRegistration()
    return null
  }
}

export function clearPendingRegistration(): void {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    /* noop */
  }
}
