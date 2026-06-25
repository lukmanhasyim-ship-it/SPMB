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
