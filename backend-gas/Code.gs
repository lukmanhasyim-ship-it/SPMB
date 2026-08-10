// Tabel route dengan role yang diizinkan.
// 'auth' dan 'register' menangani verifikasi token Google sendiri (guard dilewati di doPost).
var ROUTES = {
  auth: { handler: handleAuth, roles: [] },
  register: { handler: handleRegister, roles: [] },

  getSiswa: { handler: handleGetSiswa, roles: ['siswa', 'admin', 'guru', 'panitia_mpls'] },
  updateSiswa: { handler: handleUpdateSiswa, roles: ['siswa', 'admin'] },
  adminRegisterSiswa: { handler: handleAdminRegisterSiswa, roles: ['admin'] },
  deleteSiswa: { handler: handleDeleteSiswa, roles: ['admin'] },
  deleteAllSiswa: { handler: handleDeleteAllSiswa, roles: ['admin'] },
  getReferralStats: { handler: handleGetReferralStats, roles: ['admin', 'guru'] },

  getGelombang: { handler: handleGetGelombang, roles: ['siswa', 'admin', 'guru', 'panitia_mpls'] },
  updateGelombang: { handler: handleUpdateGelombang, roles: ['admin'] },
  deleteGelombang: { handler: handleDeleteGelombang, roles: ['admin'] },
  getConfig: { handler: handleGetConfig, roles: ['siswa', 'admin', 'guru', 'panitia_mpls'] },
  updateConfig: { handler: handleUpdateConfig, roles: ['admin'] },

  getEvents: { handler: handleGetEvents, roles: ['siswa', 'admin', 'guru', 'panitia_mpls'] },
  sendBroadcast: { handler: handleSendBroadcast, roles: ['admin', 'panitia_mpls'] },
  deleteEvent: { handler: handleDeleteEvent, roles: ['admin', 'panitia_mpls'] },
  updateEvent: { handler: handleUpdateEvent, roles: ['admin', 'panitia_mpls'] },

  upload: { handler: handleUpload, roles: ['siswa', 'admin', 'panitia_mpls'] },

  getEngagement: { handler: handleGetEngagement, roles: ['siswa', 'admin', 'guru', 'panitia_mpls'] },
  toggleLike: { handler: handleToggleLike, roles: ['siswa', 'admin', 'guru', 'panitia_mpls'] },
  addKomentar: { handler: handleAddKomentar, roles: ['siswa', 'admin', 'guru', 'panitia_mpls'] },
  sendReminder: { handler: handleSendReminder, roles: ['siswa', 'admin', 'guru', 'panitia_mpls'] },

  getTimeline: { handler: handleGetTimeline, roles: ['siswa', 'admin', 'guru', 'panitia_mpls'] },
  addTimeline: { handler: handleAddTimeline, roles: ['admin'] },
  updateTimeline: { handler: handleUpdateTimeline, roles: ['admin'] },
  deleteTimeline: { handler: handleDeleteTimeline, roles: ['admin'] },

  getAdminList: { handler: handleAdminList, roles: ['admin'] },
  addAdmin: { handler: handleAdminAdd, roles: ['admin'] },
  updateAdmin: { handler: handleAdminUpdate, roles: ['admin'] },
  deleteAdmin: { handler: handleAdminDelete, roles: ['admin'] },

  mplsLookupById: { handler: handleMplsLookupById, roles: ['panitia_mpls', 'admin', 'guru'] },
  mplsAddKehadiran: { handler: handleMplsAddKehadiran, roles: ['panitia_mpls', 'admin'] },
  mplsGetKehadiran: { handler: handleMplsGetKehadiran, roles: ['panitia_mpls', 'admin', 'guru'] },
  mplsAddIzin: { handler: handleMplsAddIzin, roles: ['panitia_mpls', 'admin'] },
  mplsGetIzin: { handler: handleMplsGetIzin, roles: ['panitia_mpls', 'admin', 'guru'] },
  mplsDeleteIzin: { handler: handleMplsDeleteIzin, roles: ['panitia_mpls', 'admin'] }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'SPMB API is running' }))
    .setMimeType(ContentService.MimeType.JSON)
}

function doOptions() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
}

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents)
    var action = params.action

    if (action === 'setup') {
      var setupResult = setupSheet(params.sheetId)
      if (params.googleClientId) {
        var props = PropertiesService.getScriptProperties()
        if (!props.getProperty('GOOGLE_CLIENT_ID')) {
          props.setProperty('GOOGLE_CLIENT_ID', String(params.googleClientId).trim())
        }
      }
      return jsonOutput(setupResult)
    }

    var route = ROUTES[action]
    if (!route) {
      return jsonOutput({ status: 'error', message: 'Unknown action: ' + action })
    }

    var session = null
    if (action !== 'auth' && action !== 'register') {
      var guard = requireAuth_(params, route.roles)
      if (guard.error) {
        return jsonOutput({ status: 'error', code: 'AUTH_REQUIRED', message: guard.error })
      }
      session = guard.session
    }

    var result = route.handler(params, session)
    return jsonOutput(result)
  } catch (err) {
    console.error('SPMB API error (' + new Date().toISOString() + '): ' + (err && err.stack ? err.stack : err))
    return jsonOutput({ status: 'error', message: 'Terjadi kesalahan pada server. Silakan coba lagi.' })
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}

function getWIBTime() {
  return Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
}
