// ============================================================
// Keamanan: Sesi, Otentikasi & Otorisasi
// ============================================================

// CacheService membatasi TTL maksimal 6 jam per entri.
var SESSION_TTL_SEC = 6 * 60 * 60

// Membuat token sesi acak (UUID ganda) dan menyimpannya di Script Cache.
function createSession_(email, role) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '')
  var sess = {
    email: String(email || '').toLowerCase().trim(),
    role: role,
    exp: Date.now() + SESSION_TTL_SEC * 1000
  }
  CacheService.getScriptCache().put('sess:' + token, JSON.stringify(sess), SESSION_TTL_SEC)
  return token
}

function getSession_(token) {
  if (!token) return null
  var raw = CacheService.getScriptCache().get('sess:' + token)
  if (!raw) return null
  try {
    var sess = JSON.parse(raw)
    if (!sess || !sess.email || !sess.exp || sess.exp < Date.now()) return null
    return sess
  } catch (e) {
    return null
  }
}

function revokeSession_(token) {
  if (token) CacheService.getScriptCache().remove('sess:' + token)
}

// Menentukan role dari email (prioritas: Admin sheet > Guru sheet > Siswa sheet).
function resolveRole_(email) {
  var adminData = findRowByKey('Admin', 'email', email)
  if (adminData) return adminData.role || 'admin'
  var guruData = findRowByKey('Guru', 'email', email)
  if (guruData) return guruData.role || 'guru_smp'
  var existing = findRowByKey('Siswa', 'email', email)
  if (existing) return 'siswa'
  return 'new'
}

// Verifikasi token Google + cek audience aplikasi (GOOGLE_CLIENT_ID).
function verifyGoogleTokenStrict_(token) {
  var verify = verifyGoogleToken_(token)
  if (!verify.valid) return verify

  var payload = verify.payload
  if (payload.email_verified === false) {
    return { valid: false, error: 'Email Google belum diverifikasi' }
  }

  var expectedAud = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID')
  if (expectedAud && payload.aud && String(payload.aud) !== String(expectedAud)) {
    return { valid: false, error: 'Token tidak sesuai aplikasi ini' }
  }

  return { valid: true, payload: payload }
}

// Guard otorisasi berbasis role. Kembalikan { session } atau { error }.
function requireAuth_(params, allowedRoles) {
  var token = params.token || params.sessionToken || ''
  var sess = getSession_(token)
  if (!sess) return { error: 'Sesi tidak valid. Silakan login ulang.' }
  if (allowedRoles && allowedRoles.length > 0 && allowedRoles.indexOf(sess.role) === -1) {
    return { error: 'Akses ditolak' }
  }
  return { session: sess }
}

// Pembatasan laju per email dengan fixed-window (tidak me-reset TTL tiap hit).
// checkRateLimit_ mengembalikan { allowed, retryAfterSec } agar frontend bisa countdown.
function checkRateLimit_(email, scope, maxPerWindow, windowSec) {
  var norm = String(email || '').toLowerCase().trim()
  var countKey = 'rl:' + scope + ':' + norm
  var startKey = 'rl:' + scope + ':' + norm + ':start'
  var cache = CacheService.getScriptCache()
  var now = Date.now()

  var start = Number(cache.get(startKey) || 0)
  var count = Number(cache.get(countKey) || 0)

  // Jendela baru bila belum ada atau sudah kedaluwarsa.
  if (!start || (now - start) >= windowSec * 1000) {
    start = now
    count = 0
    cache.put(startKey, String(start), windowSec)
    cache.put(countKey, '0', windowSec)
  }

  count += 1
  if (count > maxPerWindow) {
    var elapsedSec = Math.floor((now - start) / 1000)
    var retryAfter = windowSec - elapsedSec
    if (!(retryAfter > 0)) retryAfter = 1
    console.error('SPMB rate-limit (' + scope + ') email=' + norm + ' count=' + count + ' retryAfter=' + retryAfter + 's')
    return { allowed: false, retryAfterSec: retryAfter }
  }

  var elapsed = Math.floor((now - start) / 1000)
  var remaining = windowSec - elapsed
  if (!(remaining > 0)) remaining = 1
  // Simpan counter dengan sisa TTL jendela agar jendela tetap (fixed), tidak geser.
  cache.put(countKey, String(count), remaining)
  return { allowed: true, retryAfterSec: 0 }
}

// Kompatibilitas: pemanggil lama yang hanya butuh boolean.
function rateLimit_(email, scope, maxPerWindow, windowSec) {
  return checkRateLimit_(email, scope, maxPerWindow, windowSec).allowed
}

// Hapus counter setelah aksi sukses agar user yang berhasil tidak ikut terhukum.
function resetRateLimit_(email, scope) {
  var norm = String(email || '').toLowerCase().trim()
  if (!norm) return
  var cache = CacheService.getScriptCache()
  cache.remove('rl:' + scope + ':' + norm)
  cache.remove('rl:' + scope + ':' + norm + ':start')
}
