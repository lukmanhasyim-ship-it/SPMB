var TIMELINE_TEXT_COLUMNS = ['tanggal_mulai', 'tanggal_selesai']

function handleGetTimeline() {
  initializeSheets()
  var data = getAllRows('Timeline_SPMB')
  data.sort(function (a, b) {
    return (parseInt(a.urutan, 10) || 0) - (parseInt(b.urutan, 10) || 0)
  })
  return { status: 'ok', data: data }
}

function handleAddTimeline(params) {
  initializeSheets()

  var namaTahapan = (params.nama_tahapan || '').trim()
  if (!namaTahapan) return { status: 'error', message: 'Nama tahapan wajib diisi' }

  var now = new Date()
  var idTimeline = 'TML-' + now.getTime().toString(36).toUpperCase()

  addRow('Timeline_SPMB', {
    id_timeline: idTimeline,
    urutan: params.urutan || '1',
    nama_tahapan: namaTahapan,
    deskripsi: params.deskripsi || '',
    tanggal_mulai: params.tanggal_mulai || '',
    tanggal_selesai: params.tanggal_selesai || '',
    status: params.status || 'Aktif',
    created_at: getWIBTime(),
    updated_at: getWIBTime()
  }, TIMELINE_TEXT_COLUMNS)

  return { status: 'ok', message: 'Tahapan berhasil ditambahkan', data: handleGetTimeline().data }
}

function handleUpdateTimeline(params) {
  initializeSheets()

  var idTimeline = (params.id_timeline || '').trim()
  if (!idTimeline) return { status: 'error', message: 'ID tahapan wajib diisi' }

  var existing = findRowByKey('Timeline_SPMB', 'id_timeline', idTimeline)
  if (!existing) return { status: 'error', message: 'Tahapan tidak ditemukan' }

  var updateData = {}
  if (params.urutan !== undefined) updateData.urutan = params.urutan
  if (params.nama_tahapan !== undefined) updateData.nama_tahapan = params.nama_tahapan
  if (params.deskripsi !== undefined) updateData.deskripsi = params.deskripsi
  if (params.tanggal_mulai !== undefined) updateData.tanggal_mulai = params.tanggal_mulai
  if (params.tanggal_selesai !== undefined) updateData.tanggal_selesai = params.tanggal_selesai
  if (params.status !== undefined) updateData.status = params.status
  updateData.updated_at = getWIBTime()

  updateRow('Timeline_SPMB', 'id_timeline', idTimeline, updateData, TIMELINE_TEXT_COLUMNS)

  return { status: 'ok', message: 'Tahapan berhasil diperbarui', data: handleGetTimeline().data }
}

function handleDeleteTimeline(params) {
  initializeSheets()

  var idTimeline = (params.id_timeline || '').trim()
  if (!idTimeline) return { status: 'error', message: 'ID tahapan wajib diisi' }

  var sheet = getSheet('Timeline_SPMB')
  var data = sheet.getDataRange().getValues()
  var headers = data[0]
  var idIdx = headers.indexOf('id_timeline')
  if (idIdx === -1) return { status: 'error', message: 'Kolom id_timeline tidak ditemukan' }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === idTimeline) {
      sheet.deleteRow(i + 1)
      return { status: 'ok', message: 'Tahapan berhasil dihapus', data: handleGetTimeline().data }
    }
  }

  return { status: 'error', message: 'Tahapan tidak ditemukan' }
}
