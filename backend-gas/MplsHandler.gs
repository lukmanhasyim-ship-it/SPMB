function getWIBDate_() {
  return Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd")
}

// Google Sheets otomatis mengubah string tanggal menjadi Date.
// Saat dibaca kembali nilainya berupa Date (ISO), jadi selalu normalisasi ke string.
function normalizeWIBDate_(value) {
  if (!value) return ''
  if (value instanceof Date) {
    return Utilities.formatDate(value, "GMT+7", "yyyy-MM-dd")
  }
  var str = String(value)
  var match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return match[1] + '-' + match[2] + '-' + match[3]
  var parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, "GMT+7", "yyyy-MM-dd")
  }
  return str
}

function normalizeWIBTime_(value) {
  if (!value) return ''
  if (value instanceof Date) {
    return Utilities.formatDate(value, "GMT+7", "HH:mm:ss")
  }
  var str = String(value)
  var match = str.match(/(\d{2}):(\d{2}):(\d{2})/)
  if (match) return match[1] + ':' + match[2] + ':' + match[3]
  var parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, "GMT+7", "HH:mm:ss")
  }
  return str
}

function cleanKehadiranRow_(row) {
  var cleaned = {}
  var keys = Object.keys(row)
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] !== '_rowIndex') {
      cleaned[keys[i]] = row[keys[i]]
    }
  }
  cleaned.tanggal = normalizeWIBDate_(cleaned.tanggal)
  cleaned.jam = normalizeWIBTime_(cleaned.jam)
  cleaned.keterangan = getAbsenKeterangan_(cleaned.jam)
  return cleaned
}

// Pagi 06:00-10:59, Siang 11:00-16:59, Malam 17:00-05:59
function getAbsenKeterangan_(jamValue) {
  var jam = normalizeWIBTime_(jamValue)
  if (!jam) return ''
  var h = parseInt(String(jam).split(':')[0], 10)
  if (h >= 6 && h < 11) return 'Absen Pagi'
  if (h >= 11 && h < 17) return 'Absen Siang'
  return 'Absen Malam'
}

function handleMplsLookupById(params) {
  initializeSheets()

  var idPendaftaran = (params.id_pendaftaran || '').trim()
  if (!idPendaftaran) return { status: 'error', message: 'ID pendaftaran wajib diisi' }

  var siswa = findRowByKey('Siswa', 'id_pendaftaran', idPendaftaran)
  if (!siswa) return { status: 'error', message: 'Siswa tidak ditemukan. Periksa barcode bukti pendaftaran.' }

  var today = normalizeWIBDate_(params.tanggal) || getWIBDate_()
  var kehadiranList = getAllRows('Kehadiran_MPLS')
  var hadirHariIni = false
  for (var i = 0; i < kehadiranList.length; i++) {
    if (String(kehadiranList[i].id_pendaftaran) === idPendaftaran && normalizeWIBDate_(kehadiranList[i].tanggal) === today) {
      hadirHariIni = true
      break
    }
  }

  return {
    status: 'ok',
    data: {
      id_pendaftaran: siswa.id_pendaftaran,
      nama_lengkap: siswa.nama_lengkap || '',
      email: siswa.email || '',
      pilihan_jurusan: siswa.pilihan_jurusan || '',
      gelombang: siswa.gelombang || '',
      tahun_ajaran: siswa.tahun_ajaran || '',
      status_pendaftaran: siswa.status_pendaftaran || '',
      hadir_hari_ini: hadirHariIni
    }
  }
}

function handleMplsAddKehadiran(params) {
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

  var idPendaftaran = (params.id_pendaftaran || '').trim()
  var scanOleh = (params.scan_oleh || '').trim()
  if (!idPendaftaran) { lock.releaseLock(); return { status: 'error', message: 'ID pendaftaran wajib diisi' } }

  var siswa = findRowByKey('Siswa', 'id_pendaftaran', idPendaftaran)
  if (!siswa) { lock.releaseLock(); return { status: 'error', message: 'Siswa tidak ditemukan. Periksa barcode bukti pendaftaran.' } }

  var today = getWIBDate_()
  var kehadiranList = getAllRows('Kehadiran_MPLS')
  for (var i = 0; i < kehadiranList.length; i++) {
    if (String(kehadiranList[i].id_pendaftaran) === idPendaftaran && normalizeWIBDate_(kehadiranList[i].tanggal) === today) {
      lock.releaseLock()
      return { status: 'error', message: siswa.nama_lengkap + ' sudah tercatat hadir hari ini' }
    }
  }

  var now = new Date()
  var idKehadiran = 'KHD-' + now.getTime().toString(36).toUpperCase()
  var jam = getWIBTime()

  addRow('Kehadiran_MPLS', {
    id_kehadiran: idKehadiran,
    id_pendaftaran: idPendaftaran,
    nama_lengkap: siswa.nama_lengkap || '',
    email: siswa.email || '',
    jurusan: siswa.pilihan_jurusan || '',
    gelombang: siswa.gelombang || '',
    tanggal: today,
    jam: jam,
    scan_oleh: scanOleh,
    created_at: jam
  })

  lock.releaseLock()

  return {
    status: 'ok',
    message: 'Absensi berhasil',
    data: {
      id_kehadiran: idKehadiran,
      id_pendaftaran: idPendaftaran,
      nama_lengkap: siswa.nama_lengkap || '',
      email: siswa.email || '',
      jurusan: siswa.pilihan_jurusan || '',
      gelombang: siswa.gelombang || '',
      tanggal: today,
      jam: normalizeWIBTime_(jam),
      keterangan: getAbsenKeterangan_(jam)
    }
  }
}

function handleMplsGetKehadiran(params) {
  initializeSheets()

  var allData = getAllRows('Kehadiran_MPLS')
  var tanggal = normalizeWIBDate_(params.tanggal) || ''

  if (!tanggal) {
    var allResult = []
    for (var k = 0; k < allData.length; k++) {
      allResult.push(cleanKehadiranRow_(allData[k]))
    }
    return { status: 'ok', data: allResult }
  }

  var result = []
  for (var i = 0; i < allData.length; i++) {
    if (normalizeWIBDate_(allData[i].tanggal) === tanggal) {
      result.push(cleanKehadiranRow_(allData[i]))
    }
  }
  return { status: 'ok', data: result }
}
