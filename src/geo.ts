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

export function indexToCoords(pos: number, w: number): [x: number, y: number] {
  return [pos % w, Math.floor(pos / w)]
}

export function manhattanDistance(p1: [x: number, y: number], p2: [x: number, y: number]): number {
  return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1])
}

export function euclideanDistance(p1: [x: number, y: number], p2: [x: number, y: number]): number {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
}
