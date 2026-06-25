function handleGetGelombang() {
  initializeSheets()
  var data = getAllRows('Pengaturan_Gelombang')
  return { status: 'ok', data: data }
}

function handleUpdateGelombang(params) {
  initializeSheets()

  var gelombang = params.gelombang
  if (!gelombang) return { status: 'error', message: 'Nama gelombang wajib diisi' }

  var existing = findRowByKey('Pengaturan_Gelombang', 'gelombang', gelombang)
  if (!existing) {
    addRow('Pengaturan_Gelombang', {
      gelombang: gelombang,
      tanggal_mulai: params.tanggal_mulai || '',
      tanggal_selesai: params.tanggal_selesai || '',
      link_group_wa: params.link_group_wa || '',
      status: params.status || 'Non-Aktif'
    })
  } else {
    var updateData = {}
    if (params.tanggal_mulai !== undefined) updateData.tanggal_mulai = params.tanggal_mulai
    if (params.tanggal_selesai !== undefined) updateData.tanggal_selesai = params.tanggal_selesai
    if (params.link_group_wa !== undefined) updateData.link_group_wa = params.link_group_wa
    if (params.status !== undefined) updateData.status = params.status
    updateRow('Pengaturan_Gelombang', 'gelombang', gelombang, updateData)
  }

  var allData = getAllRows('Pengaturan_Gelombang')
  return { status: 'ok', data: allData }
}

function handleGetConfig() {
  initializeSheets()
  var configs = getAllRows('Sistem_Config')
  var result = {}
  for (var i = 0; i < configs.length; i++) {
    result[configs[i].key] = configs[i].value
  }
  return { status: 'ok', data: result }
}

function handleUpdateConfig(params) {
  initializeSheets()

  var key = params.key
  var value = params.value
  if (!key) return { status: 'error', message: 'Key wajib diisi' }

  var existing = findRowByKey('Sistem_Config', 'key', key)
  if (!existing) {
    addRow('Sistem_Config', { key: key, value: String(value) })
  } else {
    updateRow('Sistem_Config', 'key', key, { value: String(value) })
  }

  return { status: 'ok', message: 'Config updated' }
}

function handleDeleteGelombang(params) {
  initializeSheets()

  var gelombang = (params.gelombang || '').trim()
  if (!gelombang) return { status: 'error', message: 'Nama gelombang wajib diisi' }

  var sheet = getSheet('Pengaturan_Gelombang')
  var data = sheet.getDataRange().getValues()
  var headers = data[0]
  var gelIdx = headers.indexOf('gelombang')
  if (gelIdx === -1) return { status: 'error', message: 'Kolom gelombang tidak ditemukan' }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][gelIdx]) === gelombang) {
      sheet.deleteRow(i + 1)
      var allData = getAllRows('Pengaturan_Gelombang')
      return { status: 'ok', message: 'Gelombang berhasil dihapus', data: allData }
    }
  }

  return { status: 'error', message: 'Gelombang tidak ditemukan' }
}

function handleGetEvents() {
  initializeSheets()
  var data = getAllRows('Informasi_Event')
  return { status: 'ok', data: data }
}

function handleSendBroadcast(params) {
  initializeSheets()

  var judul = (params.judul || '').trim()
  var deskripsi = (params.deskripsi || '').trim()
  var target = params.target || 'Semua'

  if (!judul || !deskripsi) {
    return { status: 'error', message: 'Judul dan deskripsi wajib diisi' }
  }

  var count = 0
  if (target === 'Semua') {
    var allSiswa = getAllRows('Siswa')
    count = allSiswa.length
  } else {
    var filtered = getAllRows('Siswa')
    for (var i = 0; i < filtered.length; i++) {
      if (filtered[i].gelombang === target) count++
    }
  }

  var now = new Date()
  var idEvent = 'EVT-' + now.getTime().toString(36).toUpperCase()

  addRow('Informasi_Event', {
    id_event: idEvent,
    target_gelombang: target,
    judul: judul,
    deskripsi: deskripsi,
    status_kirim: 'Terkirim',
    created_at: getWIBTime()
  })

  return {
    status: 'ok',
    message: 'Notifikasi berhasil dikirim',
    data: {
      idEvent: idEvent,
      targetCount: count
    }
  }
}

function getConfigValue(configs, key, defaultValue) {
  for (var i = 0; i < configs.length; i++) {
    if (configs[i].key === key) {
      return configs[i].value || defaultValue
    }
  }
  return defaultValue
}
