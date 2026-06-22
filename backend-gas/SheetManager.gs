var SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID')

function setupSheet(sheetId) {
  if (sheetId) {
    SpreadsheetApp.openById(sheetId)
    SHEET_ID = sheetId
    PropertiesService.getScriptProperties().setProperty('SHEET_ID', SHEET_ID)
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

function addRow(sheetName, data) {
  var sheet = getSheet(sheetName)
  var headers = sheet.getDataRange().getValues()[0]

  if (!headers || headers.length === 0) {
    headers = Object.keys(data)
    sheet.appendRow(headers)
  }

  var row = []
  for (var i = 0; i < headers.length; i++) {
    row.push(data[headers[i]] || '')
  }
  sheet.appendRow(row)
  return true
}

function updateRow(sheetName, keyColumn, keyValue, data) {
  var existing = findRowByKey(sheetName, keyColumn, keyValue)
  if (!existing) return false

  var sheet = getSheet(sheetName)
  var headers = sheet.getDataRange().getValues()[0]
  var rowIndex = existing._rowIndex

  for (var j = 0; j < headers.length; j++) {
    if (data[headers[j]] !== undefined) {
      sheet.getRange(rowIndex, j + 1).setValue(data[headers[j]])
    }
  }
  return true
}

function ensureHeaders(sheetName, headers) {
  var sheet = getSheet(sheetName)
  var existing = sheet.getDataRange().getValues()
  if (existing.length === 0) {
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
  ensureHeaders('Siswa', [
    'id_pendaftaran', 'email', 'pilihan_jurusan', 'pilihan_alternatif',
    'nama_lengkap', 'jenis_kelamin', 'nisn', 'nik', 'tempat_lahir',
    'tanggal_lahir', 'agama', 'asal_sekolah', 'dusun', 'rt_rw',
    'desa', 'kecamatan', 'kabupaten', 'kode_pos', 'koordinat_maps',
    'tinggal_bersama', 'nama_ayah', 'kerja_ayah', 'nama_ibu', 'kerja_ibu',
    'telepon_ortu', 'foto_profil_url', 'berkas_pdf_url', 'prestasi',
    'alasan_pilih_jurusan', 'gelombang', 'tahun_ajaran', 'status_pendaftaran',
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

  ensureHeaders('Informasi_Event', [
    'id_event', 'target_gelombang', 'judul', 'deskripsi', 'status_kirim', 'created_at'
  ])

  seedInitialData()
}
