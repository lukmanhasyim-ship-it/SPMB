function handleAdminList() {
  initializeSheets()
  var admins = getAllRows('Admin')
  return { status: 'ok', data: admins }
}

// Daftar guru SMP/MTs yang mendaftar mandiri (sheet Guru).
function handleGetGuruList() {
  initializeSheets()
  var gurus = getAllRows('Guru')
  return { status: 'ok', data: gurus }
}

function handleDeleteGuru(params) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  if (!email) return { status: 'error', message: 'Email wajib diisi' }

  var sheet = getSheet('Guru')
  var data = sheet.getDataRange().getValues()
  var headers = data[0]
  var emailIdx = headers.indexOf('email')
  if (emailIdx === -1) return { status: 'error', message: 'Kolom email tidak ditemukan' }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailIdx]) === email) {
      sheet.deleteRow(i + 1)
      return { status: 'ok', message: 'Data guru berhasil dihapus' }
    }
  }

  return { status: 'error', message: 'Data guru tidak ditemukan' }
}

function normalizeRole_(rawRole) {
  var role = (rawRole || '').trim().toLowerCase()
  if (role === 'admin') return 'admin'
  if (role === 'guru') return 'guru'
  if (role === 'guru_smp' || role === 'gurusmp' || role === 'guru smp' || role === 'guru-smp') {
    return 'guru_smp'
  }
  if (role === 'panitia_mpls' || role === 'panitia-mpls' || role === 'mpls' || role === 'panitia mpls') {
    return 'panitia_mpls'
  }
  return ''
}

function handleAdminAdd(params) {
  initializeSheets()

  var email = (params.email || '').toLowerCase().trim()
  var nama = (params.nama || '').trim()
  var role = normalizeRole_(params.role)
  var noTelp = params.no_telp || ''

  if (!email) return { status: 'error', message: 'Email wajib diisi' }
  if (!nama) return { status: 'error', message: 'Nama wajib diisi' }
  if (!role) return { status: 'error', message: 'Role tidak valid (admin/guru/guru_smp/panitia_mpls)' }

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
  if (params.no_telp !== undefined) updateData.no_telp = params.no_telp
  if (params.role !== undefined) {
    var newRole = normalizeRole_(params.role)
    if (!newRole) return { status: 'error', message: 'Role tidak valid (admin/guru/guru_smp/panitia_mpls)' }
    updateData.role = newRole
  }

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

// Opsi dropdown referral untuk formulir siswa (nama saja, tanpa email/telepon).
function handleGetReferralOptions() {
  initializeSheets()

  var admins = getAllRows('Admin')
  var seenInternal = {}
  var guruInternal = []
  for (var i = 0; i < admins.length; i++) {
    var namaAdmin = String(admins[i].nama || '').trim()
    if (namaAdmin && !seenInternal[namaAdmin.toLowerCase()]) {
      seenInternal[namaAdmin.toLowerCase()] = true
      guruInternal.push(namaAdmin)
    }
  }
  guruInternal.sort()

  var gurus = getAllRows('Guru')
  var guruSmp = []
  for (var j = 0; j < gurus.length; j++) {
    var namaGuru = String(gurus[j].nama || '').trim()
    if (namaGuru) {
      guruSmp.push({
        nama: namaGuru,
        asal_sekolah: String(gurus[j].asal_sekolah || '').trim()
      })
    }
  }
  guruSmp.sort(function (a, b) { return a.nama.localeCompare(b.nama) })

  return { status: 'ok', data: { guruInternal: guruInternal, guruSmp: guruSmp } }
}
