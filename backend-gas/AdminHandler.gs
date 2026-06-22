function handleGetAdmins() {
  initializeSheets()
  var data = getAllRows('Admin')
  return { status: 'ok', data: data }
}

function handleAddAdmin(params) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  var nama = (params.nama || '').trim()
  var role = params.role || 'admin'
  var noTelepon = params.no_telepon || ''

  if (!email) return { status: 'error', message: 'Email wajib diisi' }
  if (!nama) return { status: 'error', message: 'Nama wajib diisi' }

  var existing = findRowByKey('Admin', 'email', email)
  if (existing) {
    return { status: 'error', message: 'Admin dengan email ini sudah terdaftar' }
  }

  var now = new Date()
  addRow('Admin', {
    email: email,
    nama_lengkap: nama,
    role: role,
    no_telepon: noTelepon,
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  })

  return { status: 'ok', message: 'Admin berhasil ditambahkan' }
}

function handleUpdateAdmin(params) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  if (!email) return { status: 'error', message: 'Email wajib diisi' }

  var existing = findRowByKey('Admin', 'email', email)
  if (!existing) {
    return { status: 'error', message: 'Admin tidak ditemukan' }
  }

  var updateData = { updated_at: new Date().toISOString() }
  if (params.nama !== undefined) updateData.nama_lengkap = params.nama
  if (params.role !== undefined) updateData.role = params.role
  if (params.no_telepon !== undefined) updateData.no_telepon = params.no_telepon

  updateRow('Admin', 'email', email, updateData)
  return { status: 'ok', message: 'Admin berhasil diperbarui' }
}

function handleDeleteAdmin(params) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  if (!email) return { status: 'error', message: 'Email wajib diisi' }

  var sheet = getSheet('Admin')
  var data = sheet.getDataRange().getValues()
  var headers = data[0]
  var emailIdx = headers.indexOf('email')

  if (emailIdx === -1) return { status: 'error', message: 'Sheet Admin tidak valid' }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailIdx]).toLowerCase().trim() === email) {
      sheet.deleteRow(i + 1)
      return { status: 'ok', message: 'Admin berhasil dihapus' }
    }
  }

  return { status: 'error', message: 'Admin tidak ditemukan' }
}
