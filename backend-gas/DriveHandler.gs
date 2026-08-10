var ALLOWED_UPLOAD_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
var MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function handleUpload(params, session) {
  var fileName = (params.fileName || 'upload_' + new Date().getTime()).replace(/[\/\\:*?"<>|]/g, '_')
  var fileData = params.fileData
  var mimeType = String(params.mimeType || 'application/octet-stream').toLowerCase()

  if (ALLOWED_UPLOAD_MIMES.indexOf(mimeType) === -1) {
    return { status: 'error', message: 'Tipe file tidak diizinkan (hanya JPG/PNG/WEBP/PDF)' }
  }

  if (!fileData) {
    return { status: 'error', message: 'File data wajib diisi' }
  }

  if (!session) {
    return { status: 'error', message: 'Akses ditolak: silakan login ulang' }
  }

  if (!rateLimit_(session.email, 'upload', 50, 3600)) {
    return { status: 'error', message: 'Terlalu banyak upload, silakan coba lagi nanti' }
  }

  var base64 = fileData.indexOf(',') !== -1 ? fileData.split(',')[1] : fileData
  if (!base64) {
    return { status: 'error', message: 'File data kosong' }
  }

  var estimatedBytes = Math.floor(base64.length * 3 / 4)
  if (estimatedBytes > MAX_UPLOAD_BYTES) {
    return { status: 'error', message: 'Ukuran file maksimal 5MB' }
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

    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName)
    var file = folder.createFile(blob)

    // Akses tampil diperlukan agar foto/berkas bisa dirender di aplikasi.
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
    console.error('Upload gagal: ' + err)
    return { status: 'error', message: 'Upload gagal. Silakan coba lagi.' }
  }
}
