// Normalisasi nama sekolah untuk pencocokan (huruf kecil, spasi tunggal).
function normalizeSekolah_(v) {
  return String(v || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function handleGetSiswa(params, session) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  var isStaff = session && (session.role === 'admin' || session.role === 'guru' || session.role === 'guru_smp' || session.role === 'panitia_mpls')

  // Guru SMP/MTs hanya berhak melihat siswa dari asal sekolahnya sendiri.
  var guruSmpSekolah = ''
  if (session && session.role === 'guru_smp') {
    var guruRow = findRowByKey('Guru', 'email', session.email)
    guruSmpSekolah = normalizeSekolah_(guruRow && guruRow.asal_sekolah)
  }

  if (email) {
    if (!isStaff && (!session || session.email !== email)) {
      return { status: 'error', message: 'Akses ditolak: Anda hanya dapat mengakses data Anda sendiri' }
    }
    if (session && session.role === 'guru_smp') {
      if (!guruSmpSekolah) return { status: 'error', message: 'Akses ditolak: akun belum memiliki data asal sekolah' }
      var targetSiswa = findRowByKey('Siswa', 'email', email)
      if (!targetSiswa || normalizeSekolah_(targetSiswa.asal_sekolah) !== guruSmpSekolah) {
        return { status: 'error', message: 'Akses ditolak' }
      }
    }
    var siswa = findRowByKey('Siswa', 'email', email)
    if (!siswa) return { status: 'error', message: 'Data tidak ditemukan' }
    return { status: 'ok', data: cleanSiswaRow(siswa) }
  }

  if (!isStaff) {
    return { status: 'error', message: 'Akses ditolak' }
  }

  if (session.role === 'guru_smp' && !guruSmpSekolah) {
    return { status: 'ok', data: [] }
  }

  var allSiswa = getAllRows('Siswa')
  var result = []
  for (var i = 0; i < allSiswa.length; i++) {
    if (session.role === 'guru_smp' &&
        normalizeSekolah_(allSiswa[i].asal_sekolah) !== guruSmpSekolah) {
      continue
    }
    result.push(cleanSiswaRow(allSiswa[i]))
  }
  return { status: 'ok', data: result }
}

function handleUpdateSiswa(params, session) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  if (!email) return { status: 'error', message: 'Email wajib diisi' }

  var isAdmin = session && session.role === 'admin'
  if (!isAdmin && (!session || session.email !== email)) {
    return { status: 'error', message: 'Akses ditolak: Anda hanya dapat mengubah data Anda sendiri' }
  }

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
  if (!existing) { lock.releaseLock(); return { status: 'error', message: 'Data tidak ditemukan' } }

  var updateData = {
    updated_at: getWIBTime()
  }

  if (params.telepon_ortu) params.telepon_ortu = normalizePhone_(params.telepon_ortu)

  var allowedFields = [
    'pilihan_jurusan', 'pilihan_alternatif', 'nama_lengkap', 'jenis_kelamin',
    'nisn', 'nik', 'tempat_lahir', 'tanggal_lahir', 'agama', 'asal_sekolah',
    'dusun', 'rt_rw', 'desa', 'kecamatan', 'kabupaten', 'kode_pos',
    'koordinat_maps', 'dokumen_alamat_url', 'tinggal_bersama', 'nama_ayah', 'kerja_ayah',
    'nama_ibu', 'kerja_ibu', 'telepon_ortu', 'estimasi_penghasilan_ortu', 'prestasi',
    'alasan_pilih_jurusan', 'referral_nama', 'referral_kategori',
    'status_pendaftaran', 'foto_profil_url',
    'berkas_pdf_url'
  ]

  for (var i = 0; i < allowedFields.length; i++) {
    var field = allowedFields[i]
    if (params[field] !== undefined) {
      updateData[field] = params[field]
    }
  }

  updateRow('Siswa', 'email', email, updateData)

  lock.releaseLock()

  var updated = findRowByKey('Siswa', 'email', email)
  return { status: 'ok', data: cleanSiswaRow(updated) }
}

function handleAdminRegisterSiswa(params, session) {
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
  var nama = (params.nama_lengkap || '').trim()
  var jurusan = (params.pilihan_jurusan || '').trim()
  var nik = (params.nik || '').trim()

  if (params.telepon_ortu) params.telepon_ortu = normalizePhone_(params.telepon_ortu)

  if (!nama) { lock.releaseLock(); return { status: 'error', message: 'Nama lengkap wajib diisi' } }
  if (!jurusan) { lock.releaseLock(); return { status: 'error', message: 'Jurusan utama wajib diisi' } }

  if (email) {
    var byEmail = findRowByKey('Siswa', 'email', email)
    if (byEmail) { lock.releaseLock(); return { status: 'error', message: 'Email sudah terdaftar' } }
  }

  if (nik) {
    var allSiswa = getAllRows('Siswa')
    for (var i = 0; i < allSiswa.length; i++) {
      if (String(allSiswa[i].nik || '').trim() === nik) {
        lock.releaseLock()
        return { status: 'error', message: 'NIK sudah terdaftar' }
      }
    }
  }

  // Guru SMP/MTs: asal sekolah siswa selalu mengikuti akun gurunya (bila ada).
  if (session && session.role === 'guru_smp') {
    var guruRowReg = findRowByKey('Guru', 'email', session.email)
    var sekolahGuru = String((guruRowReg && guruRowReg.asal_sekolah) || '').trim()
    if (sekolahGuru) {
      params.asal_sekolah = sekolahGuru
    }
  }

  var configs = getAllRows('Sistem_Config')
  var tahunAjaran = getConfigValue(configs, 'TAHUN_AJARAN_AKTIF', '2026/2027')

  var gelombangList = getAllRows('Pengaturan_Gelombang')
  var gelombangAktif = ''
  for (var j = 0; j < gelombangList.length; j++) {
    if (gelombangList[j].status === 'Aktif') {
      gelombangAktif = gelombangList[j].gelombang
      break
    }
  }

  var idPendaftaran = generateId(tahunAjaran, gelombangAktif)

  if (session && (session.role === 'guru' || session.role === 'guru_smp')
      && !(params.referral_nama || '').trim() && !(params.referral_kategori || '').trim()) {
    var adminRow = findRowByKey('Admin', 'email', session.email)
    if (!adminRow) adminRow = findRowByKey('Guru', 'email', session.email)
    params.referral_nama = (adminRow && adminRow.nama ? String(adminRow.nama).trim() : session.email)
    params.referral_kategori = session.role === 'guru_smp' ? 'Guru SMP/MTs' : 'Guru SMKS AL AZHAR SEMPU'
  }

  var allowedFields = [
    'pilihan_jurusan', 'pilihan_alternatif', 'nama_lengkap', 'jenis_kelamin',
    'nisn', 'nik', 'tempat_lahir', 'tanggal_lahir', 'agama', 'asal_sekolah',
    'dusun', 'rt_rw', 'desa', 'kecamatan', 'kabupaten', 'kode_pos',
    'koordinat_maps', 'dokumen_alamat_url', 'tinggal_bersama', 'nama_ayah', 'kerja_ayah',
    'nama_ibu', 'kerja_ibu', 'telepon_ortu', 'estimasi_penghasilan_ortu', 'prestasi',
    'alasan_pilih_jurusan', 'referral_nama', 'referral_kategori'
  ]

  var data = {
    id_pendaftaran: idPendaftaran,
    email: email,
    gelombang: gelombangAktif,
    tahun_ajaran: tahunAjaran,
    status_pendaftaran: 'Terdaftar',
    waktu_daftar: getWIBTime(),
    created_at: getWIBTime(),
    updated_at: getWIBTime()
  }

  for (var k = 0; k < allowedFields.length; k++) {
    var field = allowedFields[k]
    if (params[field] !== undefined) {
      data[field] = params[field]
    }
  }

  addRow('Siswa', data)

  lock.releaseLock()

  return {
    status: 'ok',
    data: {
      id_pendaftaran: idPendaftaran,
      email: email,
      nama_lengkap: nama
    }
  }
}

function handleDeleteSiswa(params) {
  initializeSheets()

  var idPendaftaran = (params.id_pendaftaran || '').toString().trim()
  var email = (params.email || '').toLowerCase().trim()
  if (!idPendaftaran && !email) {
    return { status: 'error', message: 'ID pendaftaran atau email wajib diisi' }
  }

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

  var siswa = null
  if (idPendaftaran) {
    siswa = findRowByKey('Siswa', 'id_pendaftaran', idPendaftaran)
  }
  if (!siswa && email) {
    siswa = findRowByKey('Siswa', 'email', email)
  }
  if (!siswa) { lock.releaseLock(); return { status: 'error', message: 'Data siswa tidak ditemukan' } }

  var rowEmail = String(siswa.email || '').toLowerCase().trim()
  var deleted = deleteRowsByKey('Siswa', 'id_pendaftaran', String(siswa.id_pendaftaran))

  var relatedDeleted = 0
  if (rowEmail) {
    relatedDeleted += deleteRowsByKey('Kehadiran_MPLS', 'email', rowEmail)
    relatedDeleted += deleteRowsByKey('Izin_MPLS', 'email', rowEmail)
    relatedDeleted += deleteRowsByKey('Event_Like', 'email', rowEmail)
    relatedDeleted += deleteRowsByKey('Event_Komentar', 'email', rowEmail)
    relatedDeleted += deleteRowsByKey('Event_Pengingat', 'email', rowEmail)
  }

  lock.releaseLock()

  return {
    status: 'ok',
    message: 'Data siswa berhasil dihapus',
    deleted: deleted,
    relatedDeleted: relatedDeleted
  }
}

function handleDeleteAllSiswa(params) {
  initializeSheets()

  if (String(params.confirm || '').trim().toUpperCase() !== 'HAPUS') {
    return { status: 'error', message: 'Konfirmasi gagal: ketik HAPUS untuk melanjutkan' }
  }

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

  var counts = {}
  var sheets = ['Siswa', 'Kehadiran_MPLS', 'Izin_MPLS', 'Event_Like', 'Event_Komentar', 'Event_Pengingat']
  for (var i = 0; i < sheets.length; i++) {
    counts[sheets[i]] = clearAllRows_(sheets[i])
  }

  lock.releaseLock()

  return {
    status: 'ok',
    message: 'Semua data siswa berhasil dihapus',
    counts: counts
  }
}

function cleanSiswaRow(row) {
  var cleaned = {}
  var keys = Object.keys(row)
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] !== '_rowIndex') {
      cleaned[keys[i]] = row[keys[i]]
    }
  }

  var timeFields = ['waktu_daftar', 'created_at', 'updated_at']
  for (var j = 0; j < timeFields.length; j++) {
    var v = cleaned[timeFields[j]]
    if (v instanceof Date) {
      cleaned[timeFields[j]] = Utilities.formatDate(v, 'GMT+7', 'yyyy-MM-dd HH:mm:ss')
    } else if (v) {
      var parsed = new Date(String(v))
      if (!isNaN(parsed.getTime())) {
        cleaned[timeFields[j]] = Utilities.formatDate(parsed, 'GMT+7', 'yyyy-MM-dd HH:mm:ss')
      }
    }
  }

  return cleaned
}

function handleGetReferralStats() {
  initializeSheets()

  var allSiswa = getAllRows('Siswa')
  var map = {}

  for (var i = 0; i < allSiswa.length; i++) {
    var s = allSiswa[i]
    var nama = String(s.referral_nama || '').trim()
    var kategori = String(s.referral_kategori || '').trim()
    if (!nama) continue

    var key = kategori + '|' + nama.toLowerCase()
    if (!map[key]) {
      map[key] = {
        nama: nama,
        kategori: kategori || 'Lainnya',
        jumlah: 0,
        pendaftar: []
      }
    }
    map[key].jumlah++
    map[key].pendaftar.push({
      id_pendaftaran: String(s.id_pendaftaran || ''),
      nama_lengkap: String(s.nama_lengkap || ''),
      email: String(s.email || ''),
      jurusan: String(s.pilihan_jurusan || ''),
      gelombang: String(s.gelombang || ''),
      status_pendaftaran: String(s.status_pendaftaran || '')
    })
  }

  var stats = []
  var keys = Object.keys(map)
  for (var j = 0; j < keys.length; j++) {
    stats.push(map[keys[j]])
  }
  stats.sort(function (a, b) {
    if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori)
    return b.jumlah - a.jumlah
  })

  return { status: 'ok', data: stats }
}
