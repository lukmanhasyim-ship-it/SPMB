function handleUpload(params) {
  var fileName = (params.fileName || 'upload_' + new Date().getTime()).replace(/[\/\\:*?"<>|]/g, '_')
  var fileData = params.fileData
  var mimeType = params.mimeType || 'application/octet-stream'

  if (!fileData) {
    return { status: 'error', message: 'File data wajib diisi' }
  }

  try {
    var folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID')
    var folder
    if (folderId) {
      try {
        folder = DriveApp.getFolderById(folderId)
      } catch (e) {
        folder = DriveApp.createFolder('SPMB_Uploads')
        PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', folder.getId())
      }
    } else {
      folder = DriveApp.createFolder('SPMB_Uploads')
      PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', folder.getId())
    }

    var base64 = fileData.indexOf(',') !== -1 ? fileData.split(',')[1] : fileData
    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName)
    var file = folder.createFile(blob)

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)

    return {
      status: 'ok',
      data: {
        fileName: file.getName(),
        fileId: file.getId(),
        fileUrl: file.getUrl(),
        mimeType: mimeType
      }
    }
  } catch (err) {
    return { status: 'error', message: 'Upload gagal: ' + err.toString() }
  }
}
