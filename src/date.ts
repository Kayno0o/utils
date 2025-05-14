import type dayjs from 'dayjs'

export async function configureDayjs(djs: typeof dayjs) {
  const fr = (await import('dayjs/locale/fr')).default
  djs.locale(fr)

  const isSameOrAfter = await import('dayjs/plugin/isSameOrAfter')
  djs.extend(isSameOrAfter.default)

  const isSameOrBefore = await import('dayjs/plugin/isSameOrBefore')
  djs.extend(isSameOrBefore.default)

  const relativeTime = await import('dayjs/plugin/relativeTime')
  djs.extend(relativeTime.default)

  const utc = await import('dayjs/plugin/utc')
  djs.extend(utc.default)

  const customParseFormat = await import('dayjs/plugin/customParseFormat')
  djs.extend(customParseFormat.default)
}

type DateFormatType = 'input' | 'shortText' | 'longText' | 'datetime-input' | 'default' | 'datetimeText'
type SingleDateProp = Date | dayjs.Dayjs | string
type NullableSingleDateProp = SingleDateProp | null | undefined
type DateProp = NullableSingleDateProp | NullableSingleDateProp[]

interface DateUtilsConfig {
  separator?: string
  unique?: boolean
  utc?: boolean
}

const formats: Record<DateFormatType, string> = {
  'datetime-input': 'YYYY-MM-DD H:mm:ss',
  'datetimeText': 'ddd DD/MM/YYYY H:mm:ss',
  'default': 'DD/MM/YYYY',
  'input': 'YYYY-MM-DD',
  'longText': 'ddd DD MMM YYYY',
  'shortText': 'ddd DD/MM',
}

export function formatDate(djs: typeof dayjs, date: DateProp, format?: DateFormatType, config?: DateUtilsConfig): string
export function formatDate(djs: typeof dayjs, date: DateProp, format?: string, config?: DateUtilsConfig): string

/**
 * @param {dayjs} djs
 * @param {DateProp | DateProp[]} date
 * @param {DateFormatType | string} [format]
 * @param {DateUtilsConfig} [config]
 * @param {boolean} [config.utc] formats in utc timezone (default: false).
 * @param {boolean} [config.unique] returns unique formatted dates in case of an array (default: false).
 * @param {string} [config.separator] the separator to use when joining multiple dates (default: ', ').
 * @returns {string} formatted date(s) as a string.
 */
export function formatDate(djs: typeof dayjs, date: DateProp, format: DateFormatType | string = 'default', config: DateUtilsConfig = {}): string {
  if (Array.isArray(date)) {
    const formattedDates = date.reduce((acc, d) => {
      if (d)
        acc.push(formatDate(djs, d, format, config))

      return acc
    }, [] as string[])
    if (config.unique)
      return [...(new Set(formattedDates))].join(config.separator ?? ', ')
    return formattedDates.join(config.separator ?? ', ')
  }

  if (!date)
    return ''

  return (config.utc ? djs.utc(date) : djs(date)).format(Object.prototype.hasOwnProperty.call(formats, format) ? formats[format as keyof typeof formats] : format)
}

/**
 * @param {dayjs} djs
 * @param {SingleDateProp} date
 * @param {NullableSingleDateProp} start
 * @param {NullableSingleDateProp} end
 * @param {boolean} [utc] formats in utc timezone (default: false).
 * @returns {boolean} true if is between the start and end (inclusive), else false.
 */
export function isDateBetween(djs: typeof dayjs, date: SingleDateProp, start: NullableSingleDateProp, end: NullableSingleDateProp, utc = false): boolean {
  const d = utc ? djs.utc(date) : djs(date)
  return (start ? d.isAfter(start) : true) && (end ? d.isBefore(end) : true)
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

export function isHoliday(djs: typeof dayjs, date: SingleDateProp): boolean {
  const holidays = getFrenchHolidays(djs(date).year())
  return holidays.includes(formatDate(djs, date, 'input'))
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

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
    return 29
  }

  return DAYS_IN_MONTH[month - 1]
}
