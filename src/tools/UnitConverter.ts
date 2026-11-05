export interface UnitType {
  byte: 'B' | 'kB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'ZB' | 'YB' | 'KiB' | 'MiB' | 'GiB' | 'TiB' | 'PiB' | 'EiB' | 'ZiB' | 'YiB'
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

let unitFactors: { [Unit in keyof UnitType]?: Record<UnitType[Unit], number> } | undefined

function getUnitFactors() {
  unitFactors ??= {
    byte: {
      B: 1, // base (byte)
      kB: 1000, // kilobyte (SI, like formatFileSize with `units: 'si'`)
      MB: 1000 ** 2, // megabyte
      GB: 1000 ** 3, // gigabyte
      TB: 1000 ** 4, // terabyte
      PB: 1000 ** 5, // petabyte
      EB: 1000 ** 6, // exabyte
      ZB: 1000 ** 7, // zettabyte
      YB: 1000 ** 8, // yottabyte
      KiB: 1024, // kibibyte (IEC, like formatFileSize's default)
      MiB: 1024 ** 2, // mebibyte
      GiB: 1024 ** 3, // gibibyte
      TiB: 1024 ** 4, // tebibyte
      PiB: 1024 ** 5, // pebibyte
      EiB: 1024 ** 6, // exbibyte
      ZiB: 1024 ** 7, // zebibyte
      YiB: 1024 ** 8, // yobibyte
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
      oz: 28.349523125, // ounce
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
      BTU: 1055.05585262, // British thermal unit
      eV: 1.602176634e-19, // electronvolt
    },
    pressure: {
      Pa: 1, // base (pascal)
      kPa: 1000, // kilopascal
      hPa: 100, // hectopascal
      bar: 100000, // bar
      atm: 101325, // standard atmosphere
      psi: 6894.757293168, // pounds per square inch
      mmHg: 133.322387415, // millimeters of mercury
      inHg: 133.322387415 * 25.4, // inches of mercury
    },
    speed: {
      'm/s': 1, // base (meters per second)
      'km/h': 1000 / 3600, // kilometers per hour
      'mph': 0.44704, // miles per hour
      'kn': 1852 / 3600, // knots
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
      tsp: 0.003785411784 / 768, // US teaspoon
      tbsp: 0.003785411784 / 256, // US tablespoon
      fl_oz: 0.003785411784 / 128, // US fluid ounce
      cup: 0.003785411784 / 16, // US cup
      pt: 0.003785411784 / 8, // US pint
      qt: 0.003785411784 / 4, // US quart
      gal: 0.003785411784, // US gallon, 231 in³
      in3: 0.000016387064, // cubic inch
      ft3: 0.028316846592, // cubic foot
    },
    area: {
      mm2: 0.000001, // square millimeter
      cm2: 0.0001, // square centimeter
      m2: 1, // base (square meter)
      ha: 10000, // hectare
      km2: 1000000, // square kilometer
      in2: 0.00064516, // square inch
      ft2: 0.09290304, // square foot
      yd2: 0.83612736, // square yard
      ac: 4046.8564224, // acre
      mi2: 2589988.110336, // square mile
    },
  }

  return unitFactors
}

let unitConverterFn: {
  [K in keyof UnitType]?: Record<UnitType[K] & string, {
    from: (value: number) => number
    to: (value: number) => number
  }>
} | undefined

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
    from: (value: number) => value * factor,
    to: (value: number) => value / factor,
  }
}

function createBaseUnitConverters<Unit extends keyof UnitType>(unit: Unit) {
  const unitFactor = getUnitFactors()[unit] as Record<UnitType[Unit], number>
  const converters = {} as Record<UnitType[Unit], { from: (value: number) => number, to: (value: number) => number }>

  for (const unit in unitFactor)
    converters[unit as UnitType[Unit]] = baseUnitConverter(unitFactor[unit as UnitType[Unit]])

  return converters
}

export class UnitConverter<Unit extends keyof UnitType> {
  type: Unit
  /** The unit `value` is expressed in. */
  unit: UnitType[Unit]
  /** The input, in `unit`. */
  value: number
  private readonly baseValue: number

  constructor(type: Unit, unit: UnitType[Unit], value: number) {
    this.type = type
    this.unit = unit
    this.value = value
    this.baseValue = getUnitConverterFn()[type][unit].from(value)
  }

  static from<Unit extends keyof UnitType>(type: Unit, unit: UnitType[Unit], value: number): UnitConverter<Unit> {
    return new UnitConverter<Unit>(type, unit, value)
  }

  to(unit: UnitType[Unit]): number {
    return getUnitConverterFn()[this.type][unit].to(this.baseValue)
  }
}
