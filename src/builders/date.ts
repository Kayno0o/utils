import type { DateTranslations } from '../i18n/date/types'
import en from '../i18n/date/en'
import { ObjectEntries } from '../object'

type FormatType
= | `iso`
  | 'iso8601'
  | 'iso-datetime'
  | 'iso8601-datetime'

interface DateObject {
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

let currentLocale: DateTranslations = en

type FormatDateOption = {
  build?: DateBuilderFunction
  format?: unknown
} | {
  build?: unknown
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

export function loadDateLocale(translations: DateTranslations) {
  currentLocale = translations
}

export function dateToObject(date: Date): DateObject {
  return {
    year: String(date.getFullYear()).substring(2),
    year4: String(date.getFullYear()),
    month: String(date.getMonth() + 1),
    month2: String(date.getMonth() + 1).padStart(2, '0'),
    month3: (currentLocale as any)[`ms-${date.getMonth() + 1}`],
    month4: (currentLocale as any)[`m-${date.getMonth() + 1}`],
    day: String(date.getDate()),
    day2: String(date.getDate()).padStart(2, '0'),
    weekDay: String(date.getDay()),
    weekDay2: String(date.getDay()).padStart(2, '0'),
    weekDay3: (currentLocale as any)[`ws-${date.getDay()}`],
    weekDay4: (currentLocale as any)[`w-${date.getDay()}`],
    hour: String(date.getHours()),
    hour2: String(date.getHours()).padStart(2, '0'),
    minute: String(date.getMinutes()),
    minute2: String(date.getMinutes()).padStart(2, '0'),
    second: String(date.getSeconds()),
    second2: String(date.getSeconds()).padStart(2, '0'),
  }
}

export function formatDate(date: Date, builder: DateBuilderFunction): string
export function formatDate(date: Date, format: FormatType): string
export function formatDate(date: Date, builderOrFormat: DateBuilderFunction | FormatType): string {
  const d: DateObject = dateToObject(date)

  const reverseFormats: Record<string, keyof DateObject> = ObjectEntries(formats)
    .reduce((acc, [key, values]) => {
      for (const value of values)
        acc[value] = (d as any)[key]

      return acc
    }, {} as Record<string, keyof DateObject>)

  if (typeof builderOrFormat === 'function')
    return builderOrFormat(d, date)

  if (builderOrFormat === 'iso' || builderOrFormat === 'iso8601')
    return `${d.year4}-${d.month2}-${d.day2}`

  if (builderOrFormat === 'iso-datetime' || builderOrFormat === 'iso8601-datetime')
    return `${d.year4}-${d.month2}-${d.day2}T${d.hour2}:${d.minute2}:${d.second2}`

  return (builderOrFormat as string).replace(/y{1,4}|m{1,4}|d{1,3}|w{1,4}|h{1,2}|i{1,2}|s{1,2}/gi, format => reverseFormats[format] ?? format)
}

export function buildDate(options?: FormatDateOption | FormatType): string
export function buildDate(date?: string | Date, options?: FormatDateOption | FormatType): string
export function buildDate(dateOrOptions?: string | Date | FormatDateOption | FormatType, maybeOptions?: FormatDateOption | FormatType): string {
  let date
  let options: FormatDateOption | FormatType | undefined = maybeOptions

  if (dateOrOptions instanceof Date)
    date = dateOrOptions

  if (typeof dateOrOptions === 'string') {
    const iso = dateOrOptions.match(/^(\d{2}|\d{4})-?(\d{2})-?(\d{2})$/)

    if (iso) {
      if (iso[1].length === 2)
        iso[1] = `20${iso[1]}`

      date = new Date(iso.slice(1, 4).join('-'))
    }
    else {
      const generic = dateOrOptions.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/)

      if (generic) {
        if (generic[3].length === 2)
          generic[3] = `20${generic[3]}`

        date = new Date(generic.slice(1, 3).reverse().join('-'))
      }
    }
  }

  if (date === undefined) {
    date = new Date()
    options = dateOrOptions as FormatDateOption | FormatType
  }

  if (typeof options === 'string')
    return formatDate(date, options)

  if (options?.build)
    return formatDate(date, options.build as DateBuilderFunction)

  if (options?.format)
    return formatDate(date, options.format as FormatType)

  return formatDate(date, 'iso')
}
