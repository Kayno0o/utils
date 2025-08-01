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

export interface UnitType {
  byte: 'B' | 'kB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'ZB' | 'YB'
  distance: 'm' | 'km' | 'cm' | 'mm' | 'mi' | 'yd' | 'ft' | 'in' | 'nmi'
  weight: 'g' | 'kg' | 'mg' | 't' | 'lb' | 'oz' | 'st' | 'gr'
  temperature: 'C' | 'F' | 'K'
  energy: 'J' | 'kJ' | 'cal' | 'kcal' | 'Wh' | 'kWh' | 'BTU' | 'eV' | 'MJ'
  pressure: 'Pa' | 'kPa' | 'bar' | 'atm' | 'psi' | 'mmHg' | 'inHg' | 'hPa'
  speed: 'm/s' | 'km/h' | 'mph' | 'kn' | 'ft/s'
  time: 'ns' | 'μs' | 'ms' | 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'yr'
  volume: 'ml' | 'L' | 'm3' | 'cm3' | 'mm3' | 'gal' | 'qt' | 'pt' | 'fl_oz' | 'cup' | 'tbsp' | 'tsp' | 'in3' | 'ft3'
  area: 'mm2' | 'cm2' | 'm2' | 'ha' | 'km2' | 'in2' | 'ft2' | 'yd2' | 'ac' | 'mi2'
}

let unitFactors: { [Unit in keyof UnitType]?: Record<UnitType[Unit], number> } = {}

function getUnitFactors() {
  unitFactors ??= {
    byte: {
      B: 1, // base (byte)
      kB: 1024, // kilobyte
      MB: 1024 ** 2, // megabyte
      GB: 1024 ** 3, // gigabyte
      TB: 1024 ** 4, // terabyte
      PB: 1024 ** 5, // petabyte
      EB: 1024 ** 6, // exabyte
      ZB: 1024 ** 7, // zettabyte
      YB: 1024 ** 8, // yottabyte
    },
    distance: {
      mm: 0.001, // millimeter
      cm: 0.01, // centimeter
      m: 1, // base (meter)
      km: 1000, // kilometer
      in: 0.0254, // inch
      ft: 0.3048, // foot
      yd: 0.9144, // yard
      mi: 1609.344, // mile
      nmi: 1852, // nautical mile
    },
    weight: {
      mg: 0.001, // milligram
      g: 1, // base (gram)
      kg: 1000, // kilogram
      t: 1000000, // metric ton
      oz: 28.34952, // ounce
      lb: 453.59237, // pound
      st: 6350.29318, // stone
      gr: 0.06479891, // grain
    },
    energy: {
      J: 1, // base (joule)
      kJ: 1000, // kilojoule
      MJ: 1000000, // megajoule
      cal: 4.184, // calorie
      kcal: 4184, // kilocalorie
      Wh: 3600, // watt-hour
      kWh: 3600000, // kilowatt-hour
      BTU: 1055.06, // British thermal unit
      eV: 1.602176634e-19, // electronvolt
    },
    pressure: {
      Pa: 1, // base (pascal)
      kPa: 1000, // kilopascal
      hPa: 100, // hectopascal
      bar: 100000, // bar
      atm: 101325, // standard atmosphere
      psi: 6894.76, // pounds per square inch
      mmHg: 133.322, // millimeters of mercury
      inHg: 3386.39, // inches of mercury
    },
    speed: {
      'm/s': 1, // base (meters per second)
      'km/h': 0.277778, // kilometers per hour
      'mph': 0.44704, // miles per hour
      'kn': 0.514444, // knots
      'ft/s': 0.3048, // feet per second
    },
    time: {
      ns: 1e-9, // nanosecond
      μs: 1e-6, // microsecond
      ms: 0.001, // millisecond
      s: 1, // base (second)
      min: 60, // minute
      h: 3600, // hour
      d: 86400, // day
      wk: 604800, // week
      mo: 2629746, // month (average)
      yr: 31556952, // year (average)
    },
    volume: {
      mm3: 0.000000001, // cubic millimeter
      cm3: 0.000001, // cubic centimeter
      ml: 0.000001, // milliliter (same as cm³)
      L: 0.001, // liter
      m3: 1, // base (cubic meter)
      tsp: 0.00000492892, // teaspoon
      tbsp: 0.0000147868, // tablespoon

      fl_oz: 0.0000295735, // fluid ounce
      cup: 0.000236588, // cup
      pt: 0.000473176, // pint
      qt: 0.000946353, // quart
      gal: 0.00378541, // gallon
      in3: 0.0000163871, // cubic inch
      ft3: 0.0283168, // cubic foot
    },
    area: {
      mm2: 0.000001, // square millimeter
      cm2: 0.0001, // square centimeter
      m2: 1, // base (square meter)
      ha: 10000, // hectare
      km2: 1000000, // square kilometer
      in2: 0.00064516, // square inch
      ft2: 0.092903, // square foot
      yd2: 0.836127, // square yard
      ac: 4046.86, // acre
      mi2: 2589988.11, // square mile
    },
  }

  return unitFactors
}

let unitConverterFn: {
  [K in keyof UnitType]?: Record<UnitType[K] & string, {
    from: (value: number) => number
    to: (value: number) => number
  }>
} = {}

function getUnitConverterFn() {
  unitConverterFn ??= {
    byte: createBaseUnitConverters('byte'),
    distance: createBaseUnitConverters('distance'),
    weight: createBaseUnitConverters('weight'),
    energy: createBaseUnitConverters('energy'),
    pressure: createBaseUnitConverters('pressure'),
    speed: createBaseUnitConverters('speed'),
    time: createBaseUnitConverters('time'),
    volume: createBaseUnitConverters('volume'),
    area: createBaseUnitConverters('area'),
    temperature: {
      C: {
        from: (value: number) => value + 273.15, // C to K
        to: (value: number) => value - 273.15, // K to C
      },
      F: {
        from: (value: number) => (value + 459.67) * 5 / 9, // F to K
        to: (value: number) => value * 9 / 5 - 459.67, // K to F
      },
      K: baseUnitConverter(1), // base
    },
  }

  return unitConverterFn as {
    [K in keyof UnitType]: Record<UnitType[K] & string, {
      from: (value: number) => number
      to: (value: number) => number
    }>
  }
}

function baseUnitConverter(factor: number) {
  return {
    from: (value: number) => value / factor,
    to: (value: number) => value * factor,
  }
}

function createBaseUnitConverters<Unit extends keyof UnitType>(unit: Unit) {
  const unitFactor = getUnitFactors()[unit] as Record<UnitType[Unit], number>
  const converters: Record<UnitType[Unit], { from: (value: number) => number, to: (value: number) => number }> = {} as any
  for (const unit in unitFactor)
    converters[unit as UnitType[Unit]] = baseUnitConverter(unitFactor[unit as UnitType[Unit]])

  return converters
}

export class UnitConverter<Unit extends keyof UnitType> {
  type: Unit
  unit: UnitType[Unit]
  value: number

  constructor(type: Unit, unit: UnitType[Unit], value: number) {
    this.type = type
    this.unit = unit
    this.value = getUnitConverterFn()[type][unit].from(value)
  }

  static from<Unit extends keyof UnitType>(type: Unit, unit: UnitType[Unit], value: number): UnitConverter<Unit> {
    return new UnitConverter<Unit>(type, unit, value)
  }

  to(unit: UnitType[Unit]): number {
    return getUnitConverterFn()[this.type][unit].to(this.value)
  }
}
