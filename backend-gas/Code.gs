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
    const params = JSON.parse(e.postData.contents)
    const action = params.action

    if (action === 'setup') {
      return ContentService
        .createTextOutput(JSON.stringify(setupSheet(params.sheetId)))
        .setMimeType(ContentService.MimeType.JSON)
    }

    let result
    switch (action) {
      case 'auth':
        result = handleAuth(params)
        break
      case 'register':
        result = handleRegister(params)
        break
      case 'getSiswa':
        result = handleGetSiswa(params)
        break
      case 'getReferralStats':
        result = handleGetReferralStats()
        break
      case 'updateSiswa':
        result = handleUpdateSiswa(params)
        break
      case 'adminRegisterSiswa':
        result = handleAdminRegisterSiswa(params)
        break
      case 'getGelombang':
        result = handleGetGelombang()
        break
      case 'updateGelombang':
        result = handleUpdateGelombang(params)
        break
      case 'getConfig':
        result = handleGetConfig()
        break
      case 'updateConfig':
        result = handleUpdateConfig(params)
        break
      case 'getEvents':
        result = handleGetEvents()
        break
      case 'sendBroadcast':
        result = handleSendBroadcast(params)
        break
      case 'deleteGelombang':
        result = handleDeleteGelombang(params)
        break
      case 'upload':
        result = handleUpload(params)
        break
      case 'getEngagement':
        result = handleGetEngagement(params)
        break
      case 'toggleLike':
        result = handleToggleLike(params)
        break
      case 'addKomentar':
        result = handleAddKomentar(params)
        break
      case 'sendReminder':
        result = handleSendReminder(params)
        break
      case 'deleteEvent':
        result = handleDeleteEvent(params)
        break
      case 'updateEvent':
        result = handleUpdateEvent(params)
        break
      case 'getTimeline':
        result = handleGetTimeline()
        break
      case 'addTimeline':
        result = handleAddTimeline(params)
        break
      case 'updateTimeline':
        result = handleUpdateTimeline(params)
        break
      case 'deleteTimeline':
        result = handleDeleteTimeline(params)
        break
      case 'getAdminList':
        result = handleAdminList()
        break
      case 'addAdmin':
        result = handleAdminAdd(params)
        break
      case 'updateAdmin':
        result = handleAdminUpdate(params)
        break
      case 'deleteAdmin':
        result = handleAdminDelete(params)
        break
      case 'mplsLookupById':
        result = handleMplsLookupById(params)
        break
      case 'mplsAddKehadiran':
        result = handleMplsAddKehadiran(params)
        break
      case 'mplsGetKehadiran':
        result = handleMplsGetKehadiran(params)
        break

      default:
        result = { status: 'error', message: 'Unknown action: ' + action }
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function getWIBTime() {
  return Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
}

