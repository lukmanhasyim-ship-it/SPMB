var EVENT_TEXT_COLUMNS = ['tanggal_pelaksanaan', 'waktu_pelaksanaan']
var GELOMBANG_TEXT_COLUMNS = ['tanggal_mulai', 'tanggal_selesai']

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
    }, GELOMBANG_TEXT_COLUMNS)
  } else {
    var updateData = {}
    if (params.tanggal_mulai !== undefined) updateData.tanggal_mulai = params.tanggal_mulai
    if (params.tanggal_selesai !== undefined) updateData.tanggal_selesai = params.tanggal_selesai
    if (params.link_group_wa !== undefined) updateData.link_group_wa = params.link_group_wa
    if (params.status !== undefined) updateData.status = params.status
    updateRow('Pengaturan_Gelombang', 'gelombang', gelombang, updateData, GELOMBANG_TEXT_COLUMNS)
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
  data.sort(function (a, b) {
    var ta = new Date(a.created_at || 0).getTime()
    var tb = new Date(b.created_at || 0).getTime()
    return tb - ta
  })
  return { status: 'ok', data: data }
}

function handleSendBroadcast(params) {
  initializeSheets()

  var judul = (params.judul || '').trim()
  var deskripsi = (params.deskripsi || '').trim()
  var target = params.target || 'Semua'
  var gambarUrl = params.gambar_url || ''
  var tanggalPelaksanaan = params.tanggal_pelaksanaan || ''
  var waktuPelaksanaan = params.waktu_pelaksanaan || ''
  var tempatPelaksanaan = params.tempat_pelaksanaan || ''

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
    gambar_url: gambarUrl,
    tanggal_pelaksanaan: tanggalPelaksanaan,
    waktu_pelaksanaan: waktuPelaksanaan,
    tempat_pelaksanaan: tempatPelaksanaan,
    status_kirim: 'Terkirim',
    created_at: getWIBTime()
  }, EVENT_TEXT_COLUMNS)

  return {
    status: 'ok',
    message: 'Notifikasi berhasil dikirim',
    data: {
      idEvent: idEvent,
      targetCount: count
    }
  }
}

function handleDeleteEvent(params) {
  initializeSheets()

  var idEvent = (params.id_event || '').trim()
  if (!idEvent) return { status: 'error', message: 'ID event wajib diisi' }

  var sheet = getSheet('Informasi_Event')
  var data = sheet.getDataRange().getValues()
  var headers = data[0]
  var idIdx = headers.indexOf('id_event')
  if (idIdx === -1) return { status: 'error', message: 'Kolom id_event tidak ditemukan' }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === idEvent) {
      sheet.deleteRow(i + 1)

      deleteRowsByKey('Event_Like', 'id_event', idEvent)
      deleteRowsByKey('Event_Komentar', 'id_event', idEvent)
      deleteRowsByKey('Event_Pengingat', 'id_event', idEvent)

      var allData = getAllRows('Informasi_Event')
      return { status: 'ok', message: 'Postingan berhasil dihapus', data: allData }
    }
  }

  return { status: 'error', message: 'Postingan tidak ditemukan' }
}

function handleUpdateEvent(params) {
  initializeSheets()

  var idEvent = (params.id_event || '').trim()
  if (!idEvent) return { status: 'error', message: 'ID event wajib diisi' }

  var existing = findRowByKey('Informasi_Event', 'id_event', idEvent)
  if (!existing) return { status: 'error', message: 'Postingan tidak ditemukan' }

  var updateData = {}
  if (params.judul !== undefined) updateData.judul = params.judul
  if (params.deskripsi !== undefined) updateData.deskripsi = params.deskripsi
  if (params.target_gelombang !== undefined) updateData.target_gelombang = params.target_gelombang
  if (params.gambar_url !== undefined) updateData.gambar_url = params.gambar_url
  if (params.tanggal_pelaksanaan !== undefined) updateData.tanggal_pelaksanaan = params.tanggal_pelaksanaan
  if (params.waktu_pelaksanaan !== undefined) updateData.waktu_pelaksanaan = params.waktu_pelaksanaan
  if (params.tempat_pelaksanaan !== undefined) updateData.tempat_pelaksanaan = params.tempat_pelaksanaan

  updateRow('Informasi_Event', 'id_event', idEvent, updateData, EVENT_TEXT_COLUMNS)

  var allData = getAllRows('Informasi_Event')
  return { status: 'ok', message: 'Postingan berhasil diperbarui', data: allData }
}

function getConfigValue(configs, key, defaultValue) {
  for (var i = 0; i < configs.length; i++) {
    if (configs[i].key === key) {
      return configs[i].value || defaultValue
    }
  }
  return defaultValue
}
