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

// Menentukan role dari email (prioritas: Admin sheet > Siswa sheet).
function resolveRole_(email) {
  var adminData = findRowByKey('Admin', 'email', email)
  if (adminData) return adminData.role || 'admin'
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

// Pembatasan laju per email (anti brute-force / anti spam).
function rateLimit_(email, scope, maxPerWindow, windowSec) {
  var key = 'rl:' + scope + ':' + String(email || '').toLowerCase()
  var cache = CacheService.getScriptCache()
  var count = Number(cache.get(key) || 0) + 1
  if (count > maxPerWindow) return false
  cache.put(key, String(count), windowSec)
  return true
}
