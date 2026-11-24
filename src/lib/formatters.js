export function formatPrice(priceMinorUnits, language) {
  return new Intl.NumberFormat(language === 'gu' ? 'gu-IN' : 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(priceMinorUnits / 100)
}

export function formatDuration(minutes, language, translate) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const number = new Intl.NumberFormat(language === 'gu' ? 'gu-IN' : 'en-IN')
  const parts = []
  if (hours) parts.push(`${number.format(hours)} ${translate(hours === 1 ? 'join.hour' : 'join.hours')}`)
  if (remainingMinutes) parts.push(`${number.format(remainingMinutes)} ${translate('home.minutes')}`)
  if (!parts.length) parts.push(`${number.format(0)} ${translate('home.minutes')}`)
  return parts.join(' ')
}

export function formatCount(value, language) {
  return new Intl.NumberFormat(language === 'gu' ? 'gu-IN' : 'en-IN').format(value)
}
