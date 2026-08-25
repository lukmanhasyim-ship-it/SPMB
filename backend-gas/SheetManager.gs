var SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID')

function setupSheet(sheetId) {
  var existingId = PropertiesService.getScriptProperties().getProperty('SHEET_ID')

  // Setelah terhubung, tidak boleh diarahkan ulang via API.
  if (existingId) {
    SHEET_ID = existingId
    return { status: 'ok', message: 'Spreadsheet sudah terhubung', sheetId: existingId }
  }

  if (sheetId) {
    try {
      SpreadsheetApp.openById(sheetId)
    } catch (e) {
      return { status: 'error', message: 'Sheet ID tidak valid' }
    }
    PropertiesService.getScriptProperties().setProperty('SHEET_ID', sheetId)
    SHEET_ID = sheetId
    return { status: 'ok', message: 'Sheet terhubung', sheetId: SHEET_ID }
  }

  var ss = SpreadsheetApp.create('SPMB - Data')
  SHEET_ID = ss.getId()
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', SHEET_ID)
  return { status: 'ok', message: 'Sheet baru dibuat', sheetId: SHEET_ID, url: ss.getUrl() }
}

function ensureSpreadsheet_() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID)
  return SpreadsheetApp.openById(setupSheet().sheetId)
}

function getSheet(sheetName) {
  var ss = ensureSpreadsheet_()
  var sheet = ss.getSheetByName(sheetName)
  if (!sheet) {
    sheet = ss.insertSheet(sheetName)
  }
  return sheet
}

function getAllRows(sheetName) {
  var sheet = getSheet(sheetName)
  var data = sheet.getDataRange().getValues()
  if (data.length < 2) return []
  var headers = data[0]
  var rows = []
  for (var i = 1; i < data.length; i++) {
    var row = {}
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j]
    }
    rows.push(row)
  }
  return rows
}

function findRowByKey(sheetName, keyColumn, keyValue) {
  var sheet = getSheet(sheetName)
  var data = sheet.getDataRange().getValues()
  if (data.length < 2) return null
  var headers = data[0]
  var keyIndex = headers.indexOf(keyColumn)
  if (keyIndex === -1) return null

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]) === String(keyValue)) {
      var row = {}
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j]
      }
      row._rowIndex = i + 1
      return row
    }
  }
  return null
}

function addRow(sheetName, data, textColumns) {
  var sheet = getSheet(sheetName)

  // Deteksi header dengan mengabaikan sel kosong — sheet kosong/berisi ['']
  // dianggap tanpa header agar data tidak pernah tertulis "ke dalam kekosongan".
  var rawFirstRow = sheet.getDataRange().getValues()[0] || []
  var headers = []
  for (var h = 0; h < rawFirstRow.length; h++) {
    if (String(rawFirstRow[h]).trim() !== '') headers.push(rawFirstRow[h])
  }

  if (headers.length === 0) {
    headers = Object.keys(data)
    sheet.appendRow(headers)
  }

  var row = []
  for (var i = 0; i < headers.length; i++) {
    row.push(data[headers[i]] || '')
  }
  sheet.appendRow(row)

  if (textColumns) {
    var lastRow = sheet.getLastRow()
    for (var j = 0; j < headers.length; j++) {
      if (textColumns.indexOf(headers[j]) > -1) {
        sheet.getRange(lastRow, j + 1).setNumberFormat('@').setValue(String(data[headers[j]] || ''))
      }
    }
  }
  return true
}

function updateRow(sheetName, keyColumn, keyValue, data, textColumns) {
  var existing = findRowByKey(sheetName, keyColumn, keyValue)
  if (!existing) return false

  var sheet = getSheet(sheetName)
  var headers = sheet.getDataRange().getValues()[0]
  var rowIndex = existing._rowIndex

  for (var j = 0; j < headers.length; j++) {
    if (data[headers[j]] !== undefined) {
      var range = sheet.getRange(rowIndex, j + 1)
      if (textColumns && textColumns.indexOf(headers[j]) > -1) {
        range.setNumberFormat('@').setValue(String(data[headers[j]] || ''))
      } else {
        range.setValue(data[headers[j]])
      }
    }
  }
  return true
}

function deleteRowsByKey(sheetName, keyColumn, keyValue) {
  var sheet = getSheet(sheetName)
  var data = sheet.getDataRange().getValues()
  if (data.length < 2) return 0

  var headers = data[0]
  var keyIndex = headers.indexOf(keyColumn)
  if (keyIndex === -1) return 0

  var deleted = 0
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][keyIndex]) === String(keyValue)) {
      sheet.deleteRow(i + 1)
      deleted++
    }
  }
  return deleted
}

function clearAllRows_(sheetName) {
  var sheet = getSheet(sheetName)
  var lastRow = sheet.getLastRow()
  var deleted = 0
  for (var i = lastRow; i > 1; i--) {
    sheet.deleteRow(i)
    deleted++
  }
  return deleted
}

function ensureHeaders(sheetName, headers) {
  var sheet = getSheet(sheetName)
  var existing = sheet.getDataRange().getValues()
  var isEmpty = existing.length === 0 ||
    (existing.length === 1 && existing[0].length === 1 && existing[0][0] === '') ||
    (existing.length === 1 && existing[0].join('') === '')

  if (isEmpty) {
    sheet.clear()
    sheet.appendRow(headers)
  } else {
    var existingHeaders = existing[0]
    for (var i = 0; i < headers.length; i++) {
      if (existingHeaders.indexOf(headers[i]) === -1) {
        sheet.getRange(1, existingHeaders.length + 1).setValue(headers[i])
        existingHeaders.push(headers[i])
      }
    }
  }
}

function initializeSheets() {
  // Hanya jalankan ensureHeaders sekali untuk menghemat quota Sheets.
  // Kunci memakai versi schema: naikkan SCHEMA_VERSION agar ensureHeaders
  // berjalan kembali setelah deploy yang menambah/mengubah struktur sheet.
  var SCHEMA_VERSION = '5'
  var scriptProps = PropertiesService.getScriptProperties()
  if (scriptProps.getProperty('SCHEMA_READY_V' + SCHEMA_VERSION) === '1') {
    seedInitialData()
    return
  }

  ensureHeaders('Siswa', [
    'id_pendaftaran', 'email', 'pilihan_jurusan', 'pilihan_alternatif',
    'nama_lengkap', 'jenis_kelamin', 'nisn', 'nik', 'tempat_lahir',
    'tanggal_lahir', 'agama', 'asal_sekolah', 'dusun', 'rt_rw',
    'desa', 'kecamatan', 'kabupaten', 'kode_pos', 'koordinat_maps',
    'dokumen_alamat_url',
    'tinggal_bersama', 'nama_ayah', 'kerja_ayah', 'nama_ibu', 'kerja_ibu',
    'telepon_ortu', 'telepon_siswa', 'estimasi_penghasilan_ortu',
    'foto_profil_url', 'berkas_pdf_url', 'prestasi',
    'alasan_pilih_jurusan', 'referral_nama', 'referral_kategori',
    'gelombang', 'tahun_ajaran', 'status_pendaftaran',
    'waktu_daftar', 'created_at', 'updated_at'
  ])

  ensureHeaders('Pengaturan_Gelombang', [
    'gelombang', 'tanggal_mulai', 'tanggal_selesai', 'link_group_wa', 'status'
  ])

  ensureHeaders('Sistem_Config', [
    'key', 'value'
  ])

  ensureHeaders('Admin', [
    'email', 'nama', 'role', 'no_telp'
  ])

  ensureHeaders('Guru', [
    'email', 'nama', 'role', 'no_telp', 'created_at', 'asal_sekolah'
  ])

  ensureHeaders('Informasi_Event', [
    'id_event', 'target_gelombang', 'judul', 'deskripsi', 'gambar_url',
    'tanggal_pelaksanaan', 'waktu_pelaksanaan', 'tempat_pelaksanaan',
    'status_kirim', 'created_at', 'calendar_event_id', 'calendar_url'
  ])

  ensureHeaders('Event_Like', [
    'id_event', 'email', 'created_at'
  ])

  ensureHeaders('Event_Komentar', [
    'id_event', 'email', 'nama', 'teks', 'created_at'
  ])

  ensureHeaders('Event_Pengingat', [
    'id_event', 'email', 'nama', 'created_at'
  ])

  ensureHeaders('Kehadiran_MPLS', [
    'id_kehadiran', 'id_pendaftaran', 'nama_lengkap', 'email', 'jurusan',
    'gelombang', 'tanggal', 'jam', 'scan_oleh', 'created_at'
  ])

  ensureHeaders('Izin_MPLS', [
    'id_izin', 'id_pendaftaran', 'nama_lengkap', 'email', 'jurusan',
    'gelombang', 'tanggal', 'jenis_izin', 'catatan', 'diinput_oleh', 'created_at'
  ])

  ensureHeaders('Timeline_SPMB', [
    'id_timeline', 'urutan', 'nama_tahapan', 'deskripsi',
    'tanggal_mulai', 'tanggal_selesai', 'status', 'created_at', 'updated_at'
  ])

  PropertiesService.getScriptProperties().setProperty('SCHEMA_READY', '1')
  scriptProps.setProperty('SCHEMA_READY_V' + SCHEMA_VERSION, '1')

  seedInitialData()
}
