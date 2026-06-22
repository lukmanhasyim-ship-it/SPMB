function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'SPMB API is running' }))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents)
    const action = params.action

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
      case 'updateSiswa':
        result = handleUpdateSiswa(params)
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
      case 'upload':
        result = handleUpload(params)
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
