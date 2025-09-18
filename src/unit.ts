/**
 * Calculates the distance between two points on the Earth's surface using the Haversine formula.
 *
 * @param {number} lat1 - The latitude of the first point in degrees.
 * @param {number} lon1 - The longitude of the first point in degrees.
 * @param {number} lat2 - The latitude of the second point in degrees.
 * @param {number} lon2 - The longitude of the second point in degrees.
 * @returns {number} The distance between the two points in kilometers, rounded to the nearest integer.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2)
    return 0

  const radlat1 = (Math.PI * lat1) / 180
  const radlat2 = (Math.PI * lat2) / 180
  const theta = lon1 - lon2
  const radtheta = (Math.PI * theta) / 180
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
  if (dist > 1)
    dist = 1

  dist = Math.acos(dist)
  dist = (dist * 180) / Math.PI
  dist = dist * 60 * 1.1515
  dist *= 1.609344
  return Math.round(dist)
}

/**
 * Format bytes as human-readable text.
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @author https://stackoverflow.com/users/65387/mpen
 * @see https://stackoverflow.com/a/14919494
 */
export function formatFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024

  if (Math.abs(bytes) < thresh)
    return `${bytes} B`

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  let u = -1
  const r = 10 ** dp

  do {
    bytes /= thresh
    ++u
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)

  return `${bytes.toFixed(dp)} ${units[u]}`
}

export function formatUnit(num: number): string {
  if (num < 1000)
    return num.toString()
  const units = ['k', 'M', 'B', 'T']
  let unitIndex = -1
  let scaledNum = num
  while (scaledNum >= 1000 && unitIndex < units.length - 1) {
    scaledNum /= 1000
    unitIndex++
  }
  return `${scaledNum.toFixed(1)}${units[unitIndex]}`
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    currency: 'EUR',
    style: 'currency',
  }).format(amount)
}

export function posFrom1D(pos: number, w: number): [x: number, y: number] {
  return [pos % w, Math.floor(pos / w)]
}

export function manhattanDistance(p1: [x: number, y: number], p2: [x: number, y: number]): number {
  return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1])
}

export function euclideanDistance(p1: [x: number, y: number], p2: [x: number, y: number]): number {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
}

export function encodePath(path: [number, number][]): string {
  let encoded = ''
  let prevLat = 0
  let prevLng = 0

  for (const [lat, lng] of path) {
    encoded += encodeSignedNumber(lat - prevLat)
    encoded += encodeSignedNumber(lng - prevLng)
    prevLat = lat
    prevLng = lng
  }
  return encoded
}

function encodeSignedNumber(num: number): string {
  let sgn_num = num << 1
  if (num < 0) {
    sgn_num = ~sgn_num
  }
  return encodeUnsignedNumber(sgn_num)
}

function encodeUnsignedNumber(num: number): string {
  let encoded = ''
  while (num >= 0x20) {
    encoded += String.fromCharCode((0x20 | (num & 0x1F)) + 63)
    num >>= 5
  }
  encoded += String.fromCharCode(num + 63)
  return encoded
}

export function decodePath(encoded: string): [number, number][] {
  const path: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    const latResult = decodeSignedNumber(encoded, index)
    lat += latResult.value
    index = latResult.nextIndex

    const lngResult = decodeSignedNumber(encoded, index)
    lng += lngResult.value
    index = lngResult.nextIndex

    path.push([lat, lng])
  }
  return path
}

function decodeSignedNumber(encoded: string, index: number): { value: number, nextIndex: number } {
  const result = decodeUnsignedNumber(encoded, index)
  const delta = result.value

  const value = (delta & 1) ? ~(delta >> 1) : (delta >> 1)
  return { value, nextIndex: result.nextIndex }
}

function decodeUnsignedNumber(encoded: string, index: number): { value: number, nextIndex: number } {
  let result = 0
  let shift = 0

  while (true) {
    const b = encoded.charCodeAt(index++) - 63
    result |= (b & 0x1F) << shift
    if (b < 0x20)
      break
    shift += 5
  }

  return { value: result, nextIndex: index }
}

export function get2DPosFrom1D(pos: number, w: number): [x: number, y: number] {
  return [pos % w, Math.floor(pos / w)]
}
