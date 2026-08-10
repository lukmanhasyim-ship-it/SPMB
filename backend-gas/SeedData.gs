function seedInitialData() {
  // Hanya seed satu kali untuk menghemat quota Sheets.
  var seeded = PropertiesService.getScriptProperties().getProperty('SEEDED')
  if (seeded === '1') return

  var gelombangSheet = getSheet('Pengaturan_Gelombang')
  var existingGel = gelombangSheet.getDataRange().getValues()
  if (existingGel.length <= 1) {
    addRow('Pengaturan_Gelombang', {
      gelombang: 'Gelombang 1',
      tanggal_mulai: '1 Januari 2026',
      tanggal_selesai: '31 Maret 2026',
      link_group_wa: 'https://chat.whatsapp.com/example1',
      status: 'Aktif'
    })
    addRow('Pengaturan_Gelombang', {
      gelombang: 'Gelombang 2',
      tanggal_mulai: '1 April 2026',
      tanggal_selesai: '30 Juni 2026',
      link_group_wa: 'https://chat.whatsapp.com/example2',
      status: 'Non-Aktif'
    })
    addRow('Pengaturan_Gelombang', {
      gelombang: 'Gelombang 3',
      tanggal_mulai: '1 Juli 2026',
      tanggal_selesai: '31 Agustus 2026',
      link_group_wa: 'https://chat.whatsapp.com/example3',
      status: 'Non-Aktif'
    })
  }

  var adminSheet = getSheet('Admin')
  var existingAdmin = adminSheet.getDataRange().getValues()
  var adminFound = false
  for (var ai = 1; ai < existingAdmin.length; ai++) {
    if (existingAdmin[ai][0] === 'panitiapmb@gmail.com') {
      adminFound = true
      break
    }
  }
  if (!adminFound) {
    addRow('Admin', {
      email: 'panitiapmb@gmail.com',
      nama: 'Panitia PMB',
      role: 'admin',
      no_telp: ''
    })
    addRow('Admin', {
      email: 'admin2@gmail.com',
      nama: 'Admin 2',
      role: 'admin',
      no_telp: ''
    })
  }

  var configSheet = getSheet('Sistem_Config')
  var existingConfig = configSheet.getDataRange().getValues()
  if (existingConfig.length <= 1) {
    addRow('Sistem_Config', { key: 'TAHUN_AJARAN_AKTIF', value: '2026/2027' })
  }

  Logger.log('Seed data initialized successfully')
  PropertiesService.getScriptProperties().setProperty('SEEDED', '1')
}
