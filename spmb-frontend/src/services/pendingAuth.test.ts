import { describe, it, expect, beforeEach } from 'vitest'
import {
  setPendingRegistration,
  readPendingRegistration,
  clearPendingRegistration,
} from './pendingAuth'

const VALID_DATA = {
  email: 'budi@gmail.com',
  nama: 'Budi Santoso',
  fotoUrl: 'https://example.com/foto.png',
  token: 'google-token-abc',
}

const PENDING_KEY = 'spmb.pending-registration'

beforeEach(() => {
  localStorage.clear()
})

describe('pendingAuth', () => {
  it('menyimpan dan membaca data pending registration', () => {
    setPendingRegistration(VALID_DATA)

    const result = readPendingRegistration()

    expect(result).not.toBeNull()
    expect(result?.expired).toBe(false)
    expect(result?.data.email).toBe(VALID_DATA.email)
    expect(result?.data.nama).toBe(VALID_DATA.nama)
    expect(result?.data.fotoUrl).toBe(VALID_DATA.fotoUrl)
    expect(result?.data.token).toBe(VALID_DATA.token)
    expect(typeof result?.data.createdAt).toBe('number')
  })

  it('mengembalikan null bila tidak ada data pending', () => {
    expect(readPendingRegistration()).toBeNull()
  })

  it('menandai kedaluwarsa dan membersihkan data lebih tua dari 30 menit', () => {
    setPendingRegistration(VALID_DATA)
    const raw = JSON.parse(localStorage.getItem(PENDING_KEY)!)
    raw.createdAt = Date.now() - 31 * 60 * 1000
    localStorage.setItem(PENDING_KEY, JSON.stringify(raw))

    const result = readPendingRegistration()

    expect(result?.expired).toBe(true)
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('data korup mengembalikan null dan ikut dibersihkan', () => {
    localStorage.setItem(PENDING_KEY, '{json-rusak')

    expect(readPendingRegistration()).toBeNull()
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('data tanpa token dianggap tidak valid', () => {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ email: 'a@gmail.com', nama: 'A', fotoUrl: '', createdAt: Date.now() }),
    )

    expect(readPendingRegistration()).toBeNull()
  })

  it('clearPendingRegistration menghapus data', () => {
    setPendingRegistration(VALID_DATA)

    clearPendingRegistration()

    expect(readPendingRegistration()).toBeNull()
  })
})
