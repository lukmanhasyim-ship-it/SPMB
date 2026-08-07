function handleAuth(params) {
  initializeSheets()
  var email, nama, fotoUrl

  if (params.idToken) {
    var verify = verifyGoogleToken_(params.idToken)
    if (!verify.valid) {
      return { status: 'error', message: 'Token Google tidak valid: ' + (verify.error || '') }
    }
    if (!verify.payload.email) {
      return { status: 'error', message: 'Token Google tidak valid: email tidak ditemukan' }
    }
    email = verify.payload.email.toLowerCase().trim()
    nama = verify.payload.name || ''
    fotoUrl = verify.payload.picture || ''
  } else {
    email = (params.email || '').toLowerCase().trim()
    nama = params.nama || ''
    fotoUrl = params.fotoUrl || ''
  }

  if (!email) return { status: 'error', message: 'Email wajib diisi' }

  var configs = getAllRows('Sistem_Config')
  var tahunAjaran = getConfigValue(configs, 'TAHUN_AJARAN_AKTIF', '2026/2027')

  var adminData = findRowByKey('Admin', 'email', email)
  if (adminData) {
    return {
      status: 'ok',
      role: adminData.role || 'admin',
      user: {
        email: adminData.email,
        nama: adminData.nama || 'Admin',
        fotoUrl: fotoUrl,
        no_telp: adminData.no_telp || ''
      },
      tahunAjaran: tahunAjaran
    }
  }

  var existing = findRowByKey('Siswa', 'email', email)
  if (existing) {
    return {
      status: 'ok',
      role: 'siswa',
      user: {
        email: existing.email,
        nama: existing.nama_lengkap || existing.email,
        fotoUrl: existing.foto_profil_url || ''
      },
      tahunAjaran: tahunAjaran
    }
  }

  return {
    status: 'ok',
    role: 'new',
    user: { email: email, nama: nama, fotoUrl: fotoUrl },
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

  var email = (params.email || '').toLowerCase().trim()
  var nama = (params.nama || '').trim()
  var fotoUrl = params.fotoUrl || ''
  var referralNama = (params.referral_nama || '').trim()
  var referralKategori = (params.referral_kategori || '').trim()

  if (!email) return { status: 'error', message: 'Email wajib diisi' }
  if (!nama) return { status: 'error', message: 'Nama wajib diisi' }

  var existing = findRowByKey('Siswa', 'email', email)
  if (existing) {
    lock.releaseLock()
    return { status: 'error', message: 'Email sudah terdaftar' }
  }

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

  return {
    status: 'ok',
    role: 'siswa',
    user: { email: email, nama: nama, fotoUrl: fotoUrl },
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

  var chars = '0123456789ABCDEF'
  var random = ''
  for (var i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return 'SPMB-' + tahun + '-' + gel + '-' + random
}
