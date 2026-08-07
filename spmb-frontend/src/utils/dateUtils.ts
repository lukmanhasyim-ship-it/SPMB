export function formatWIB(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (isNaN(date.getTime())) return String(dateStr)
    
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }) + ' WIB'
  } catch {
    return String(dateStr)
  }
}

export function formatWIBShort(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (isNaN(date.getTime())) return String(dateStr)
    
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Jakarta',
    })
  } catch {
    return String(dateStr)
  }
}

function getWIBParts(date: Date): { y: number; m: number; d: number; h: number; min: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  return {
    y: parseInt(get('year'), 10),
    m: parseInt(get('month'), 10),
    d: parseInt(get('day'), 10),
    h: parseInt(get('hour'), 10),
    min: parseInt(get('minute'), 10),
  }
}

export function getSapaanWIB(): 'Pagi' | 'Siang' | 'Sore' | 'Malam' {
  const h = getWIBParts(new Date()).h
  if (h >= 3 && h < 11) return 'Pagi'
  if (h >= 11 && h < 15) return 'Siang'
  if (h >= 15 && h < 18) return 'Sore'
  return 'Malam'
}

function isTimeSentinel(value: string): boolean {
  const date = new Date(value)
  if (isNaN(date.getTime())) return false
  return date.getUTCFullYear() <= 1900
}

function timeFromTimeSentinel(value: string): string {
  const date = new Date(value)
  const total = date.getUTCHours() * 60 + date.getUTCMinutes() + 7 * 60
  const h = Math.floor(total / 60) % 24
  const min = total % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function formatWIBDateInput(value?: string | null): string {
  if (!value) return ''
  const str = String(value)
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const date = new Date(str)
  if (isNaN(date.getTime())) return ''
  if (isTimeSentinel(str)) return ''
  const p = getWIBParts(date)
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
}

export function formatWIBTime(value?: string | null): string {
  if (!value) return ''
  const str = String(value)
  if (/^\d{1,2}:\d{2}/.test(str)) return str.slice(0, 5)
  const date = new Date(str)
  if (isNaN(date.getTime())) return str
  if (isTimeSentinel(str)) return timeFromTimeSentinel(str)
  const p = getWIBParts(date)
  return `${String(p.h).padStart(2, '0')}:${String(p.min).padStart(2, '0')}`
}
