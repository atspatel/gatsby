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
