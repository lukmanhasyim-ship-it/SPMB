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
    updated_at: new Date().toISOString()
  }

  var allowedFields = [
    'pilihan_jurusan', 'pilihan_alternatif', 'nama_lengkap', 'jenis_kelamin',
    'nisn', 'nik', 'tempat_lahir', 'tanggal_lahir', 'agama', 'asal_sekolah',
    'dusun', 'rt_rw', 'desa', 'kecamatan', 'kabupaten', 'kode_pos',
    'koordinat_maps', 'tinggal_bersama', 'nama_ayah', 'kerja_ayah',
    'nama_ibu', 'kerja_ibu', 'telepon_ortu', 'prestasi',
    'alasan_pilih_jurusan', 'status_pendaftaran', 'foto_profil_url',
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
