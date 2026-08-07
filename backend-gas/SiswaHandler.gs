function handleGetSiswa(params) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  if (email) {
    var siswa = findRowByKey('Siswa', 'email', email)
    if (!siswa) return { status: 'error', message: 'Data tidak ditemukan' }
    return { status: 'ok', data: cleanSiswaRow(siswa) }
  }

  var allSiswa = getAllRows('Siswa')
  var result = []
  for (var i = 0; i < allSiswa.length; i++) {
    result.push(cleanSiswaRow(allSiswa[i]))
  }
  return { status: 'ok', data: result }
}

function handleUpdateSiswa(params) {
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
  if (!email) { lock.releaseLock(); return { status: 'error', message: 'Email wajib diisi' } }

  var existing = findRowByKey('Siswa', 'email', email)
  if (!existing) { lock.releaseLock(); return { status: 'error', message: 'Data tidak ditemukan' } }

  var updateData = {
    updated_at: getWIBTime()
  }

  var allowedFields = [
    'pilihan_jurusan', 'pilihan_alternatif', 'nama_lengkap', 'jenis_kelamin',
    'nisn', 'nik', 'tempat_lahir', 'tanggal_lahir', 'agama', 'asal_sekolah',
    'dusun', 'rt_rw', 'desa', 'kecamatan', 'kabupaten', 'kode_pos',
    'koordinat_maps', 'tinggal_bersama', 'nama_ayah', 'kerja_ayah',
    'nama_ibu', 'kerja_ibu', 'telepon_ortu', 'prestasi',
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

function handleAdminRegisterSiswa(params) {
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

  var allowedFields = [
    'pilihan_jurusan', 'pilihan_alternatif', 'nama_lengkap', 'jenis_kelamin',
    'nisn', 'nik', 'tempat_lahir', 'tanggal_lahir', 'agama', 'asal_sekolah',
    'dusun', 'rt_rw', 'desa', 'kecamatan', 'kabupaten', 'kode_pos',
    'koordinat_maps', 'tinggal_bersama', 'nama_ayah', 'kerja_ayah',
    'nama_ibu', 'kerja_ibu', 'telepon_ortu', 'prestasi',
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

function cleanSiswaRow(row) {
  var cleaned = {}
  var keys = Object.keys(row)
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] !== '_rowIndex') {
      cleaned[keys[i]] = row[keys[i]]
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
