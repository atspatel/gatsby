const AIRBNB_WIDTHS = [240, 320, 480, 720, 960, 1200, 1440, 1920]

export function photoUrl(url, width = 1200) {
  if (!url) return ''
  const allowed = AIRBNB_WIDTHS.reduce((best, candidate) =>
    Math.abs(candidate - width) < Math.abs(best - width) ? candidate : best,
  )
  const join = url.includes('?') ? '&' : '?'
  return `${url}${join}im_w=${allowed}`
}

export function isoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function nightsBetween(start, end) {
  if (!start || !end) return 0
  const ms = new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)
  return Math.round(ms / 86400000)
}

export function splitBullets(text) {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.replace(/\t/g, '').trim())
    .filter(Boolean)
  const before = []
  const items = []
  const after = []
  let seenItem = false
  for (const line of lines) {
    if (line.startsWith('•')) {
      seenItem = true
      items.push(line.replace(/^•\s*/, ''))
    } else if (!seenItem) {
      before.push(line)
    } else {
      after.push(line)
    }
  }
  return {
    before: before.join(' '),
    items,
    after: after.join(' '),
  }
}

const RATING_LABELS = {
  CHECKIN: 'Check-in',
  ACCURACY: 'Accuracy',
  LOCATION: 'Location',
  COMMUNICATION: 'Communication',
  VALUE: 'Value',
  CLEANLINESS: 'Cleanliness',
}

export function ratingLabel(category) {
  return RATING_LABELS[category] || category
}

const CLOCK = /(?<hour>\d{1,2})(?::(?<minute>\d{2}))?\s*(?<ampm>[ap])\.?m\.?/i

function clockText(fragment) {
  const match = fragment.match(CLOCK)
  if (!match) return null
  const hour = Number(match.groups.hour)
  if (hour < 1 || hour > 12) return null
  const minute = match.groups.minute || '00'
  const suffix = match.groups.ampm.toLowerCase() === 'a' ? 'AM' : 'PM'
  const lead = fragment.slice(0, match.index)
  let prefix = ''
  if (/\b(after|from)\b/i.test(lead)) prefix = 'After '
  else if (/\b(before|by|until|till)\b/i.test(lead)) prefix = 'By '
  return `${prefix}${hour}:${minute} ${suffix}`
}

function readSide(plain, label, stop) {
  const found = new RegExp(label, 'i').exec(plain)
  if (!found) return null
  let rest = plain.slice(found.index + found[0].length, found.index + found[0].length + 56)
  if (stop) {
    const end = rest.search(new RegExp(stop, 'i'))
    if (end >= 0) rest = rest.slice(0, end)
  }
  return clockText(rest)
}

function plainScheduleLine(line) {
  return line.replace(/[*#_`]/g, ' ').replace(/\s+/g, ' ').trim()
}

function isScheduleHeading(plain) {
  const core = plain
    .replace(/[^\p{L}\s/&-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return /^check-?\s*ins?\s*(?:and|&|\/)\s*check-?\s*outs?$/i.test(core)
}

function noteOnLine(plain) {
  if (!plain || plain.length > 220) return null
  const early = /\bearly check-?ins?\b/i.test(plain)
  const late = /\b(?:late check-?outs?|extensions?)\b/i.test(plain)
  if (early === late) return null
  const text = plain.replace(/^[-*•✿❀✦\s]+/u, '').trim()
  if (!text) return null
  return { side: early ? 'checkIn' : 'checkOut', text }
}

function timesOnLine(line) {
  const plain = plainScheduleLine(line)
  if (!plain || plain.length > 220) {
    return { checkIn: null, checkOut: null, time: false, note: null, heading: false }
  }
  const checkIn = readSide(plain, 'check-?\\s*in\\b', 'check-?\\s*out\\b')
  const checkOut = readSide(plain, 'check-?\\s*out\\b')
  const note = checkIn || checkOut ? null : noteOnLine(plain)
  return {
    checkIn,
    checkOut,
    time: Boolean(checkIn || checkOut),
    note,
    heading: isScheduleHeading(plain),
  }
}

function scheduleFrom(text) {
  let checkIn = null
  let checkOut = null
  let checkInNote = null
  let checkOutNote = null
  for (const line of String(text || '').split('\n')) {
    const found = timesOnLine(line)
    if (!checkIn && found.checkIn) checkIn = found.checkIn
    if (!checkOut && found.checkOut) checkOut = found.checkOut
    if (found.note?.side === 'checkIn' && !checkInNote) checkInNote = found.note.text
    if (found.note?.side === 'checkOut' && !checkOutNote) checkOutNote = found.note.text
  }
  if (!checkIn && !checkOut) return null
  return { checkIn, checkOut, checkInNote, checkOutNote }
}

export function staySchedule(listing) {
  const text = (listing.description?.sections || []).map((section) => section.text || '').join('\n')
  return scheduleFrom(text)
}

export function omitStayTimes(text, schedule) {
  if (!schedule?.checkIn && !schedule?.checkOut) return text
  const lines = String(text || '').split('\n')
  const info = lines.map((line) => timesOnLine(line))
  return lines
    .filter((line, index) => {
      if (info[index].time || info[index].note) return false
      if (!info[index].heading) return true
      for (let next = index + 1; next < lines.length; next += 1) {
        const plain = lines[next].trim()
        if (!plain) continue
        if (/^#{1,6}\s+/.test(plain) || info[next].heading) break
        if (!info[next].time && !info[next].note) return true
      }
      return false
    })
    .join('\n')
}
