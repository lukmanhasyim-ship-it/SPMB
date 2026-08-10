function handleAuth(params) {
  initializeSheets()

  var idToken = params.idToken || ''
  if (!idToken) {
    return { status: 'error', message: 'Token Google wajib diisi' }
  }

  var verify = verifyGoogleTokenStrict_(idToken)
  if (!verify.valid) {
    return { status: 'error', message: 'Token Google tidak valid: ' + (verify.error || '') }
  }
  if (!verify.payload.email) {
    return { status: 'error', message: 'Token Google tidak valid: email tidak ditemukan' }
  }

  var email = verify.payload.email.toLowerCase().trim()
  if (!rateLimit_(email, 'auth', 20, 3600)) {
    return { status: 'error', message: 'Terlalu banyak percobaan, silakan coba lagi nanti' }
  }

  var nama = verify.payload.name || ''
  var fotoUrl = verify.payload.picture || ''

  var role = resolveRole_(email)
  var sessionToken = createSession_(email, role)

  var configs = getAllRows('Sistem_Config')
  var tahunAjaran = getConfigValue(configs, 'TAHUN_AJARAN_AKTIF', '2026/2027')

  var user
  if (role === 'siswa') {
    var existing = findRowByKey('Siswa', 'email', email)
    user = {
      email: email,
      nama: (existing && existing.nama_lengkap) || nama || email,
      fotoUrl: (existing && existing.foto_profil_url) || fotoUrl || ''
    }
  } else if (role === 'new') {
    user = { email: email, nama: nama || email, fotoUrl: fotoUrl || '' }
  } else {
    var adminData = findRowByKey('Admin', 'email', email)
    user = {
      email: email,
      nama: (adminData && adminData.nama) || nama || 'Pengguna',
      fotoUrl: fotoUrl || '',
      no_telp: (adminData && adminData.no_telp) || ''
    }
  }

  return {
    status: 'ok',
    role: role,
    user: user,
    sessionToken: sessionToken,
    tahunAjaran: tahunAjaran
  }
}

function verifyGoogleToken_(token) {
  // Try as OAuth2 access token first (from initTokenClient flow)
  var payload = fetchTokenInfo_('https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(token))
  if (payload && payload.email && !isTokenError_(payload)) {
    return { valid: true, payload: payload }
  }

  // Fallback: try as Google ID token (JWT)
  payload = fetchTokenInfo_('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token))
  if (payload && payload.email && !isTokenError_(payload)) {
    return { valid: true, payload: payload }
  }

  var err = (payload && (payload.error || payload.error_description)) || 'Token tidak valid'
  return { valid: false, error: err }
}

function fetchTokenInfo_(url) {
  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true })
    var body = response.getContentText()
    if (!body) return null
    var payload = JSON.parse(body)
    if (typeof payload === 'string') payload = JSON.parse(payload)
    return payload
  } catch (e) {
    return null
  }
}

function isTokenError_(payload) {
  return !!(payload.error || payload.error_description)
}

function handleRegister(params) {
  initializeSheets()

  var idToken = params.idToken || ''
  if (!idToken) {
    return { status: 'error', message: 'Token Google wajib diisi' }
  }

  var verify = verifyGoogleTokenStrict_(idToken)
  if (!verify.valid) {
    return { status: 'error', message: 'Token Google tidak valid: ' + (verify.error || '') }
  }
  if (!verify.payload.email) {
    return { status: 'error', message: 'Token Google tidak valid: email tidak ditemukan' }
  }

  var tokenEmail = verify.payload.email.toLowerCase().trim()
  var email = (params.email || '').toLowerCase().trim()
  if (!email) return { status: 'error', message: 'Email wajib diisi' }
  if (email !== tokenEmail) {
    return { status: 'error', message: 'Email tidak sesuai dengan akun Google Anda' }
  }

  if (!rateLimit_(email, 'register', 5, 3600)) {
    return { status: 'error', message: 'Terlalu banyak percobaan pendaftaran, silakan coba lagi nanti' }
  }

  var nama = (params.nama || verify.payload.name || '').trim()
  if (!nama) return { status: 'error', message: 'Nama wajib diisi' }

  var lock = LockService.getScriptLock()
  var locked = false
  try {
    locked = lock.tryLock(10000)
  } catch (e) {
    locked = false
  }
  if (!locked) {
    return { status: 'error', message: 'Sistem sedang sibuk, silakan coba lagi' }
  }

  var existing = findRowByKey('Siswa', 'email', email)
  if (existing) {
    lock.releaseLock()
    return { status: 'error', message: 'Email sudah terdaftar' }
  }

  var fotoUrl = params.fotoUrl || ''
  var referralNama = (params.referral_nama || '').trim()
  var referralKategori = (params.referral_kategori || '').trim()

  var configs = getAllRows('Sistem_Config')
  var tahunAjaran = getConfigValue(configs, 'TAHUN_AJARAN_AKTIF', '2026/2027')

  var gelombangList = getAllRows('Pengaturan_Gelombang')
  var gelombangAktif = ''
  for (var i = 0; i < gelombangList.length; i++) {
    if (gelombangList[i].status === 'Aktif') {
      gelombangAktif = gelombangList[i].gelombang
      break
    }
  }

  var idPendaftaran = generateId(tahunAjaran, gelombangAktif)

  var now = new Date()
  var data = {
    id_pendaftaran: idPendaftaran,
    email: email,
    nama_lengkap: nama,
    foto_profil_url: fotoUrl,
    referral_nama: referralNama,
    referral_kategori: referralKategori,
    gelombang: gelombangAktif,
    tahun_ajaran: tahunAjaran,
    status_pendaftaran: 'Draft',
    waktu_daftar: getWIBTime(),
    created_at: getWIBTime(),
    updated_at: getWIBTime()
  }

  addRow('Siswa', data)

  lock.releaseLock()

  var sessionToken = createSession_(email, 'siswa')

  return {
    status: 'ok',
    role: 'siswa',
    user: { email: email, nama: nama, fotoUrl: fotoUrl },
    sessionToken: sessionToken,
    idPendaftaran: idPendaftaran
  }
}

function generateId(tahunAjaran, gelombang) {
  var tahun = tahunAjaran.split('/')[0].slice(-2) + tahunAjaran.split('/')[1].slice(-2)
  var gel = 'XX'
  if (gelombang) {
    var parts = gelombang.split(' ')
    if (parts.length > 1) gel = 'G' + parts[1]
  }

  // 8 karakter hex acak (kriptografis via Utilities.getUuid).
  var uuid = Utilities.getUuid().replace(/-/g, '')
  var random = uuid.slice(0, 8).toUpperCase()

  return 'SPMB-' + tahun + '-' + gel + '-' + random
}
