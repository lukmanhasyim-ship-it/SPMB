function handleAdminList() {
  initializeSheets()
  var admins = getAllRows('Admin')
  return { status: 'ok', data: admins }
}

function handleAdminAdd(params) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  var nama = (params.nama || '').trim()
  var role = (params.role || 'admin').trim()
  var noTelp = params.no_telp || ''

  if (!email) return { status: 'error', message: 'Email wajib diisi' }
  if (!nama) return { status: 'error', message: 'Nama wajib diisi' }

  var existing = findRowByKey('Admin', 'email', email)
  if (existing) return { status: 'error', message: 'Email admin sudah terdaftar' }

  addRow('Admin', {
    email: email,
    nama: nama,
    role: role,
    no_telp: noTelp
  })

  return { status: 'ok', message: 'Admin berhasil ditambahkan' }
}

function handleAdminUpdate(params) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  if (!email) return { status: 'error', message: 'Email wajib diisi' }

  var existing = findRowByKey('Admin', 'email', email)
  if (!existing) return { status: 'error', message: 'Admin tidak ditemukan' }

  var updateData = {}
  if (params.nama !== undefined) updateData.nama = params.nama
  if (params.role !== undefined) updateData.role = params.role
  if (params.no_telp !== undefined) updateData.no_telp = params.no_telp

  updateRow('Admin', 'email', email, updateData)
  return { status: 'ok', message: 'Admin berhasil diperbarui' }
}

function handleAdminDelete(params) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  if (!email) return { status: 'error', message: 'Email wajib diisi' }

  var sheet = getSheet('Admin')
  var data = sheet.getDataRange().getValues()
  var headers = data[0]
  var emailIdx = headers.indexOf('email')
  if (emailIdx === -1) return { status: 'error', message: 'Kolom email tidak ditemukan' }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailIdx]) === email) {
      sheet.deleteRow(i + 1)
      return { status: 'ok', message: 'Admin berhasil dihapus' }
    }
  }

  return { status: 'error', message: 'Admin tidak ditemukan' }
}
