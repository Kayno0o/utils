import type { DateTranslations } from '../i18n/date/types'
import { pad } from '../date'
import en from '../i18n/date/en'
import { typedObjectEntries } from '../object'

type FormatType
  = | 'iso'
    | 'iso8601'
    | 'iso-datetime'
    | 'iso8601-datetime'
    | (string & {})

export interface DateObject {
  year: string
  year4: string
  month: string
  month2: string
  month3: string
  month4: string
  day: string
  day2: string
  weekDay: string
  weekDay2: string
  weekDay3: string
  weekDay4: string
  hour: string
  hour2: string
  minute: string
  minute2: string
  second: string
  second2: string
}

export type DateBuilderFunction = (dateObject: DateObject, date: Date) => string

type FormatDateOption = {
  build?: DateBuilderFunction
  format?: never
} | {
  build?: never
  format?: FormatType
}

const formats: Record<keyof DateObject, string[]> = {
  year: ['y', 'yy'],
  year4: ['Y', 'yyyy'],
  month: ['m'],
  month2: ['mm', 'M'],
  month3: ['mmm'],
  month4: ['mmmm'],
  day: ['d'],
  day2: ['dd', 'D'],
  weekDay: ['w'],
  weekDay2: ['ww', 'W'],
  weekDay3: ['www'],
  weekDay4: ['wwww'],
  hour: ['h'],
  hour2: ['hh', 'H'],
  minute: ['i'],
  minute2: ['ii', 'I'],
  second: ['s'],
  second2: ['ss', 'S'],
}

const TOKEN_TO_KEY: Record<string, keyof DateObject> = Object.fromEntries(
  typedObjectEntries(formats).flatMap(([key, tokens]) => tokens.map(token => [token, key] as const)),
)

const FORMAT_TOKEN_REGEX = /y{1,4}|m{1,4}|d{1,3}|w{1,4}|h{1,2}|i{1,2}|s{1,2}/gi
const ISO_DATE_INPUT_REGEX = /^(\d{2}|\d{4})-?(\d{2})-?(\d{2})$/
const SLASH_DATE_INPUT_REGEX = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/

/** A local-midnight Date, a two-digit year read as 20xx. */
function localDate(year: string, month: string, day: string): Date {
  return new Date(Number(year.length === 2 ? `20${year}` : year), Number(month) - 1, Number(day))
}

function buildDateFormatter(getLocale: () => DateTranslations) {
  function dateToObject(date: Date): DateObject {
    const locale = getLocale()

    return {
      year: String(date.getFullYear()).substring(2),
      year4: String(date.getFullYear()),
      month: String(date.getMonth() + 1),
      month2: pad(date.getMonth() + 1),
      month3: locale[`ms-${date.getMonth() + 1}` as keyof DateTranslations],
      month4: locale[`m-${date.getMonth() + 1}` as keyof DateTranslations],
      day: String(date.getDate()),
      day2: pad(date.getDate()),
      weekDay: String(date.getDay()),
      weekDay2: pad(date.getDay()),
      weekDay3: locale[`ws-${date.getDay() || 7}` as keyof DateTranslations],
      weekDay4: locale[`w-${date.getDay() || 7}` as keyof DateTranslations],
      hour: String(date.getHours()),
      hour2: pad(date.getHours()),
      minute: String(date.getMinutes()),
      minute2: pad(date.getMinutes()),
      second: String(date.getSeconds()),
      second2: pad(date.getSeconds()),
    }
  }

  function formatDate(date: Date, builder: DateBuilderFunction): string
  function formatDate(date: Date, format: FormatType): string

  function formatDate(date: Date, builderOrFormat: DateBuilderFunction | FormatType): string {
    const d: DateObject = dateToObject(date)

    if (typeof builderOrFormat === 'function')
      return builderOrFormat(d, date)

    if (builderOrFormat === 'iso' || builderOrFormat === 'iso8601')
      return `${d.year4}-${d.month2}-${d.day2}`

    if (builderOrFormat === 'iso-datetime' || builderOrFormat === 'iso8601-datetime')
      return `${d.year4}-${d.month2}-${d.day2}T${d.hour2}:${d.minute2}:${d.second2}`

    return (builderOrFormat as string).replace(FORMAT_TOKEN_REGEX, (token) => {
      const key = TOKEN_TO_KEY[token]

      return key ? d[key] : token
    })
  }

  function buildDate(options?: FormatDateOption | FormatType): string
  function buildDate(date?: string | Date, options?: FormatDateOption | FormatType): string

  function buildDate(dateOrOptions?: string | Date | FormatDateOption | FormatType, maybeOptions?: FormatDateOption | FormatType): string {
    let date
    let options: FormatDateOption | FormatType | undefined = maybeOptions

    if (dateOrOptions instanceof Date)
      date = dateOrOptions

    if (typeof dateOrOptions === 'string') {
      const iso = ISO_DATE_INPUT_REGEX.exec(dateOrOptions)
      const slashed = SLASH_DATE_INPUT_REGEX.exec(dateOrOptions)

      if (iso)
        date = localDate(iso[1]!, iso[2]!, iso[3]!)
      else if (slashed)
        date = localDate(slashed[3]!, slashed[2]!, slashed[1]!)
    }

    if (date === undefined) {
      date = new Date()
      options = dateOrOptions as FormatDateOption | FormatType
    }

    if (typeof options === 'string')
      return formatDate(date, options)

    if (options?.build)
      return formatDate(date, options.build)

    return options?.format ? formatDate(date, options.format) : formatDate(date, 'iso')
  }

  return { dateToObject, formatDate, buildDate }
}

/** Creates an isolated date formatter bound to `locale`, without mutating global locale state. */
export function createDateFormatter(locale: DateTranslations = en) {
  return buildDateFormatter(() => locale)
}

let currentLocale: DateTranslations = en
const defaultFormatter = buildDateFormatter(() => currentLocale)

export function loadDateLocale(translations: DateTranslations) {
  currentLocale = translations
}

export const dateToObject = defaultFormatter.dateToObject
export const formatDate = defaultFormatter.formatDate
export const buildDate = defaultFormatter.buildDate
