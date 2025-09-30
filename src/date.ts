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

  const formattedDate = dateObj.toISOString().split('T')[0]

  return holidays.includes(formattedDate)
}

export function stringToMsDuration(duration: string | number): number {
  if (typeof duration === 'number')
    return duration

  const match = duration.match(/(\d+)([a-z])/i)

  if (!match)
    return 0

  const [, time, unit] = match
  let factor = 1

  if (unit === 'm')
    factor = 60

  if (unit === 'h')
    factor = 60 * 60

  if (unit === 'd')
    factor = 60 * 60 * 24

  if (unit === 'w')
    factor = 60 * 60 * 24 * 7

  if (unit === 'M')
    factor = 60 * 60 * 24 * 30

  if (unit === 'y')
    factor = 60 * 60 * 24 * 365

  return Number(time) * factor * 1000
}
