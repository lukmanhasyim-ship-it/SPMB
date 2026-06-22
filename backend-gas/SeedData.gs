function seedInitialData() {
  initializeSheets()

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

  var configSheet = getSheet('Sistem_Config')
  var existingConfig = configSheet.getDataRange().getValues()
  if (existingConfig.length <= 1) {
    addRow('Sistem_Config', { key: 'TAHUN_AJARAN_AKTIF', value: '2026/2027' })
    addRow('Sistem_Config', { key: 'ADMIN_EMAIL_LIST', value: 'panitiapmb@gmail.com,admin2@gmail.com' })
  }

  var adminSheet = getSheet('Admin')
  var existingAdmin = adminSheet.getDataRange().getValues()
  if (existingAdmin.length <= 1) {
    addRow('Admin', {
      email: 'panitiapmb@gmail.com',
      nama_lengkap: 'Panitia PMB',
      role: 'superadmin',
      no_telepon: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  Logger.log('Seed data initialized successfully')
}
