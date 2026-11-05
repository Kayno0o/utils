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
  let signed = num << 1

  if (num < 0)
    signed = ~signed

  return encodeUnsignedNumber(signed)
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
    const [latValue, latIndex] = decodeSignedNumber(encoded, index)

    lat += latValue
    index = latIndex

    const [lngValue, lngIndex] = decodeSignedNumber(encoded, index)

    lng += lngValue
    index = lngIndex

    path.push([lat, lng])
  }

  return path
}

function decodeSignedNumber(encoded: string, index: number): [ value: number, nextIndex: number ] {
  const [delta, nextIndex] = decodeUnsignedNumber(encoded, index)
  const value = (delta & 1) ? ~(delta >> 1) : (delta >> 1)

  return [value, nextIndex]
}

function decodeUnsignedNumber(encoded: string, index: number): [ value: number, nextIndex: number ] {
  let result = 0
  let shift = 0

  while (true) {
    if (index >= encoded.length)
      throw new SyntaxError('Truncated polyline')

    const b = encoded.charCodeAt(index++) - 63

    if (b < 0 || b > 0x3F)
      throw new SyntaxError(`Invalid polyline character at ${index - 1}`)

    result |= (b & 0x1F) << shift

    if (b < 0x20)
      break

    shift += 5
  }

  return [result, index]
}
