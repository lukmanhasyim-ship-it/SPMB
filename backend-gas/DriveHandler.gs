function handleUpload(params) {
  var folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID')

  var fileName = params.fileName || 'untitled'
  var fileData = params.fileData
  var mimeType = params.mimeType || 'application/octet-stream'

  if (!fileData) {
    return { status: 'error', message: 'File data wajib diisi' }
  }

  try {
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

    var blob = Utilities.newBlob(Utilities.base64Decode(fileData), mimeType, fileName)
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
