function handleSendReminder(params, session) {
  initializeSheets()

  var idEvent = (params.id_event || '').trim()
  var email = (session && session.email) || (params.email || '').toLowerCase().trim()
  var nama = (params.nama || '').trim()

  if (!idEvent) return { status: 'error', message: 'ID event wajib diisi' }
  if (!email) return { status: 'error', message: 'Email wajib diisi' }

  var event = findRowByKey('Informasi_Event', 'id_event', idEvent)
  if (!event) return { status: 'error', message: 'Event tidak ditemukan' }

  var existingReminders = getAllRows('Event_Pengingat')
  for (var i = 0; i < existingReminders.length; i++) {
    if (String(existingReminders[i].id_event) === idEvent && String(existingReminders[i].email || '').toLowerCase() === email) {
      return { status: 'error', message: 'Pengingat untuk event ini sudah dibuat' }
    }
  }

  var calendarUrl = String(event.calendar_url || '').trim()
  var calendarEventId = String(event.calendar_event_id || '').trim()

  if (!calendarEventId) {
    try {
      var created = createCalendarEvent_(event)
      if (created) {
        calendarEventId = created.id
        calendarUrl = created.htmlLink
        updateRow('Informasi_Event', 'id_event', idEvent, {
          calendar_event_id: calendarEventId,
          calendar_url: calendarUrl
        })
      }
    } catch (e) {
      // Kalender gagal dibuat, pengingat tetap dicatat
    }
  }

  addRow('Event_Pengingat', {
    id_event: idEvent,
    email: email,
    nama: nama,
    created_at: getWIBTime()
  })

  return {
    status: 'ok',
    message: 'Pengingat berhasil dibuat',
    data: {
      id_event: idEvent,
      calendar_url: calendarUrl,
      add_to_calendar_url: buildAddToCalendarUrl_(event)
    }
  }
}

function createCalendarEvent_(event) {
  var title = '[SPMB] ' + (event.judul || 'Kegiatan SPMB')
  var desc = (event.deskripsi || '') + '\n\nInformasi resmi Panitia SPMB.'

  var dateStr = String(event.tanggal_pelaksanaan || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'))
  var timeStr = event.waktu_pelaksanaan || '07:00'
  var start = new Date(dateStr + 'T' + timeStr + ':00+07:00')
  var end = new Date(start.getTime() + 60 * 60 * 1000)

  var calendar = CalendarApp.getDefaultCalendar()
  var createdEvent = calendar.createEvent(title, start, end, {
    description: desc,
    location: event.tempat_pelaksanaan || undefined
  })
  createdEvent.addEmailReminder(60)
  createdEvent.addEmailReminder(1440)

  return {
    id: createdEvent.getId(),
    htmlLink: 'https://www.google.com/calendar/event?eid=' + encodeURIComponent(createdEvent.getId())
  }
}

function buildAddToCalendarUrl_(event) {
  if (!event.tanggal_pelaksanaan) return ''
  var dateStr = String(event.tanggal_pelaksanaan).replace(/-/g, '')
  var time = (event.waktu_pelaksanaan || '07:00').replace(':', '')
  var startHour = parseInt(time.substring(0, 2), 10)
  var endHour = (startHour + 1) % 24
  var startDate = dateStr + 'T' + time + '00'
  var endDate = dateStr + 'T' + String(endHour).padStart(2, '0') + time.substring(2) + '00'

  var params = {
    action: 'TEMPLATE',
    text: '[Pengingat] ' + (event.judul || 'Kegiatan SPMB'),
    dates: startDate + '/' + endDate,
    ctz: 'Asia/Jakarta'
  }
  if (event.tempat_pelaksanaan) params.location = event.tempat_pelaksanaan
  if (event.deskripsi) params.details = event.deskripsi

  var qs = []
  for (var key in params) {
    qs.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
  }
  return 'https://calendar.google.com/calendar/render?' + qs.join('&')
}
