function handleGetEngagement(params) {
  initializeSheets()

  var idEvent = (params.id_event || '').trim()
  if (!idEvent) return { status: 'error', message: 'ID event wajib diisi' }
  var email = (params.email || '').toLowerCase().trim()

  var likes = getAllRows('Event_Like')
  var likeCount = 0
  var isLiked = false
  for (var i = 0; i < likes.length; i++) {
    if (String(likes[i].id_event) === idEvent) {
      likeCount++
      if (email && String(likes[i].email) === email) isLiked = true
    }
  }

  return {
    status: 'ok',
    data: {
      id_event: idEvent,
      like_count: likeCount,
      is_liked: isLiked,
      comments: getCommentsForEvent_(idEvent)
    }
  }
}

function handleToggleLike(params) {
  initializeSheets()

  var idEvent = (params.id_event || '').trim()
  var email = (params.email || '').toLowerCase().trim()
  if (!idEvent) return { status: 'error', message: 'ID event wajib diisi' }
  if (!email) return { status: 'error', message: 'Email wajib diisi' }

  var lock = LockService.getScriptLock()
  var locked = false
  try { locked = lock.tryLock(10000) } catch (e) { locked = false }
  if (!locked) return { status: 'error', message: 'Sistem sedang sibuk, silakan coba lagi' }

  var sheet = getSheet('Event_Like')
  var data = sheet.getDataRange().getValues()
  var headers = data[0] || []
  var idIdx = headers.indexOf('id_event')
  var emailIdx = headers.indexOf('email')

  if (idIdx === -1 || emailIdx === -1) {
    ensureHeaders('Event_Like', ['id_event', 'email', 'created_at'])
    data = sheet.getDataRange().getValues()
    headers = data[0] || []
    idIdx = headers.indexOf('id_event')
    emailIdx = headers.indexOf('email')
  }

  var isLiked = false
  var rowToDelete = -1
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === idEvent && String(data[i][emailIdx]) === email) {
      isLiked = true
      rowToDelete = i + 1
      break
    }
  }

  if (isLiked) {
    sheet.deleteRow(rowToDelete)
  } else {
    addRow('Event_Like', { id_event: idEvent, email: email, created_at: getWIBTime() })
  }

  lock.releaseLock()

  var allLikes = getAllRows('Event_Like')
  var count = 0
  for (var j = 0; j < allLikes.length; j++) {
    if (String(allLikes[j].id_event) === idEvent) count++
  }

  return { status: 'ok', data: { like_count: count, is_liked: !isLiked } }
}

function handleAddKomentar(params) {
  initializeSheets()

  var idEvent = (params.id_event || '').trim()
  var email = (params.email || '').toLowerCase().trim()
  var nama = (params.nama || '').trim()
  var teks = (params.teks || '').trim()

  if (!idEvent) return { status: 'error', message: 'ID event wajib diisi' }
  if (!email) return { status: 'error', message: 'Email wajib diisi' }
  if (!teks) return { status: 'error', message: 'Komentar tidak boleh kosong' }

  addRow('Event_Komentar', {
    id_event: idEvent,
    email: email,
    nama: nama || email.split('@')[0],
    teks: teks,
    created_at: getWIBTime()
  })

  return { status: 'ok', data: getCommentsForEvent_(idEvent) }
}

function getCommentsForEvent_(idEvent) {
  var all = getAllRows('Event_Komentar')
  var result = []
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].id_event) === idEvent) {
      result.push({
        email: all[i].email || '',
        nama: all[i].nama || '',
        teks: all[i].teks || '',
        created_at: all[i].created_at || ''
      })
    }
  }
  result.sort(function (a, b) {
    return String(a.created_at).localeCompare(String(b.created_at))
  })
  return result
}
