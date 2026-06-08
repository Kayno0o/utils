export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export function calculateEaster(year: number): Date {
  const f = Math.floor
  const G = year % 19
  const C = f(year / 100)
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11))
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7
  const L = I - J
  const month = 3 + f((L + 40) / 44)
  const day = L + 28 - 31 * f(month / 4)

  return new Date(year, month - 1, day)
}

export function getFrenchHolidays(year: number): string[] {
  const holidays: Record<string, string> = {
    'All Saints\' Day': `${year}-11-01`,
    'Armistice Day': `${year}-11-11`,
    'Assumption of Mary': `${year}-08-15`,
    'Bastille Day': `${year}-07-14`,
    'Christmas Day': `${year}-12-25`,
    'Labour Day': `${year}-05-01`,
    'New Year\'s Day': `${year}-01-01`,
    'Victory in Europe Day': `${year}-05-08`,
  }

  const easter = calculateEaster(year)
  const addDays = (date: Date, days: number): string => {
    const result = new Date(date)

    result.setDate(result.getDate() + days)

    return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`
  }

  holidays['Easter Monday'] = addDays(easter, 1)
  holidays['Ascension Day'] = addDays(easter, 39)
  holidays['Whit Monday'] = addDays(easter, 50)

  return Object.values(holidays)
}

export function isHoliday(date: Date | string): boolean {
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const holidays = getFrenchHolidays(year)

  const formattedDate = dateObj.toISOString().split('T')[0]!

  return holidays.includes(formattedDate)
}

const DURATION_UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
  M: 1000 * 60 * 60 * 24 * 30,
  y: 1000 * 60 * 60 * 24 * 365,
}

/**
 * Convert a human-readable duration into milliseconds.
 *
 * Supports single units (`'5m'`) as well as compound durations made of
 * several space-separated (or concatenated) parts, e.g. `'1d 7h'` or `'1d7h30m'`.
 *
 * Units are case-sensitive: `m` is minutes while `M` is months.
 * Supported units: `s`, `m`, `h`, `d`, `w`, `M`, `y`.
 *
 * @param duration - A duration string, or a number that is returned unchanged (already ms).
 * @returns The duration in milliseconds, or `0` when no valid part is found.
 */
export function stringToMsDuration(duration: string | number): number {
  if (typeof duration === 'number')
    return duration

  let total = 0

  for (const [, time, unit] of duration.matchAll(/(\d+)\s*([a-z])/gi)) {
    const factor = DURATION_UNIT_MS[unit!]

    if (factor !== undefined)
      total += Number(time) * factor
  }

  return total
}
