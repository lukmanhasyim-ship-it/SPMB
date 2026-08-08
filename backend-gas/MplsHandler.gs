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
  var absensiHariIni = []
  for (var i = 0; i < kehadiranList.length; i++) {
    if (String(kehadiranList[i].id_pendaftaran) === idPendaftaran && normalizeWIBDate_(kehadiranList[i].tanggal) === today) {
      absensiHariIni.push(cleanKehadiranRow_(kehadiranList[i]))
    }
  }

  var izinList = getAllRows('Izin_MPLS')
  var izinHariIni = []
  for (var j = 0; j < izinList.length; j++) {
    if (String(izinList[j].id_pendaftaran) === idPendaftaran && normalizeWIBDate_(izinList[j].tanggal) === today) {
      izinHariIni.push(cleanIzinRow_(izinList[j]))
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
      hadir_hari_ini: absensiHariIni.length > 0,
      sesi_sekarang: getAbsenKeterangan_(getWIBTime()),
      absensi_hari_ini: absensiHariIni,
      izin_hari_ini: izinHariIni
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
  var jam = getWIBTime()
  var sesi = getAbsenKeterangan_(jam)
  var kehadiranList = getAllRows('Kehadiran_MPLS')
  var existingToday = []
  var existingSameSession = null
  for (var i = 0; i < kehadiranList.length; i++) {
    if (String(kehadiranList[i].id_pendaftaran) === idPendaftaran && normalizeWIBDate_(kehadiranList[i].tanggal) === today) {
      var cleaned = cleanKehadiranRow_(kehadiranList[i])
      existingToday.push(cleaned)
      if (cleaned.keterangan === sesi) {
        existingSameSession = cleaned
      }
    }
  }

  if (existingSameSession) {
    lock.releaseLock()
    return {
      status: 'error',
      message: 'absensi a.n ' + siswa.nama_lengkap + ' sudah dilakukan ' + (existingSameSession.scan_oleh || '-') + ' pada ' + String(existingSameSession.jam).slice(0, 5)
    }
  }

  if (existingToday.length >= 3) {
    lock.releaseLock()
    return { status: 'error', message: 'Absensi ' + siswa.nama_lengkap + ' hari ini sudah mencapai batas maksimal 3 kali' }
  }

  var now = new Date()
  var idKehadiran = 'KHD-' + now.getTime().toString(36).toUpperCase()

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

function cleanIzinRow_(row) {
  var cleaned = {}
  var keys = Object.keys(row)
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] !== '_rowIndex') {
      cleaned[keys[i]] = row[keys[i]]
    }
  }
  cleaned.tanggal = normalizeWIBDate_(cleaned.tanggal)
  cleaned.created_at = normalizeWIBTime_(cleaned.created_at)
  return cleaned
}

function handleMplsAddIzin(params) {
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
  var jenisIzin = (params.jenis_izin || '').trim()
  var catatan = (params.catatan || '').trim()
  var diinputOleh = (params.diinput_oleh || '').trim()

  if (!idPendaftaran) { lock.releaseLock(); return { status: 'error', message: 'ID pendaftaran wajib diisi' } }
  if (!jenisIzin) { lock.releaseLock(); return { status: 'error', message: 'Jenis izin wajib dipilih' } }

  var siswa = findRowByKey('Siswa', 'id_pendaftaran', idPendaftaran)
  if (!siswa) { lock.releaseLock(); return { status: 'error', message: 'Siswa tidak ditemukan. Periksa barcode bukti pendaftaran.' } }

  var today = getWIBDate_()
  var izinList = getAllRows('Izin_MPLS')
  var existing = null
  for (var i = 0; i < izinList.length; i++) {
    if (String(izinList[i].id_pendaftaran) === idPendaftaran && normalizeWIBDate_(izinList[i].tanggal) === today) {
      existing = cleanIzinRow_(izinList[i])
      break
    }
  }

  if (existing) {
    lock.releaseLock()
    return { status: 'error', message: 'Izin a.n ' + siswa.nama_lengkap + ' untuk hari ini sudah dicatat (' + existing.jenis_izin + '). Hapus izin yang ada terlebih dahulu jika ingin mengganti.' }
  }

  var now = new Date()
  var idIzin = 'IZN-' + now.getTime().toString(36).toUpperCase()

  addRow('Izin_MPLS', {
    id_izin: idIzin,
    id_pendaftaran: idPendaftaran,
    nama_lengkap: siswa.nama_lengkap || '',
    email: siswa.email || '',
    jurusan: siswa.pilihan_jurusan || '',
    gelombang: siswa.gelombang || '',
    tanggal: today,
    jenis_izin: jenisIzin,
    catatan: catatan,
    diinput_oleh: diinputOleh,
    created_at: getWIBTime()
  })

  lock.releaseLock()

  return {
    status: 'ok',
    message: 'Izin berhasil dicatat',
    data: {
      id_izin: idIzin,
      id_pendaftaran: idPendaftaran,
      nama_lengkap: siswa.nama_lengkap || '',
      email: siswa.email || '',
      jurusan: siswa.pilihan_jurusan || '',
      gelombang: siswa.gelombang || '',
      tanggal: today,
      jenis_izin: jenisIzin,
      catatan: catatan,
      diinput_oleh: diinputOleh,
      created_at: getWIBTime()
    }
  }
}

function handleMplsGetIzin(params) {
  initializeSheets()

  var allData = getAllRows('Izin_MPLS')
  var tanggal = normalizeWIBDate_(params.tanggal) || ''

  if (!tanggal) {
    var allResult = []
    for (var k = 0; k < allData.length; k++) {
      allResult.push(cleanIzinRow_(allData[k]))
    }
    return { status: 'ok', data: allResult }
  }

  var result = []
  for (var i = 0; i < allData.length; i++) {
    if (normalizeWIBDate_(allData[i].tanggal) === tanggal) {
      result.push(cleanIzinRow_(allData[i]))
    }
  }
  return { status: 'ok', data: result }
}

function handleMplsDeleteIzin(params) {
  initializeSheets()

  var idIzin = (params.id_izin || '').trim()
  if (!idIzin) return { status: 'error', message: 'ID izin wajib diisi' }

  var deleted = deleteRowsByKey('Izin_MPLS', 'id_izin', idIzin)
  if (deleted === 0) return { status: 'error', message: 'Izin tidak ditemukan' }

  return { status: 'ok', message: 'Izin berhasil dihapus' }
}
