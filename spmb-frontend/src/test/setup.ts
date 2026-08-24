import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

type MinimalStorage = {
  length: number
  clear: () => void
  getItem: (key: string) => string | null
  key: (index: number) => string | null
  removeItem: (key: string) => void
  setItem: (key: string, value: string) => void
}

function createMemoryStorage(): MinimalStorage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    key: (index) => Array.from(map.keys())[index] ?? null,
    removeItem: (key) => map.delete(key),
    setItem: (key, value) => map.set(String(key), String(value)),
  }
}

function isWorkingStorage(candidate: unknown): candidate is MinimalStorage {
  try {
    return Boolean(candidate) && typeof (candidate as MinimalStorage).clear === 'function'
  } catch {
    return false
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  let usable = false
  try {
    usable = isWorkingStorage((globalThis as Record<string, unknown>)[name])
  } catch {
    usable = false
  }
  if (!usable) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: createMemoryStorage(),
    })
  }
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})
