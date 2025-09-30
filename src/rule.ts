export type RuleFunction<T> = (arg: T) => boolean | string

type ValidRuleKeys<T, U> = {
  [K in keyof T]: T[K] extends RuleFunction<U> ? (ReturnType<T[K]> extends boolean | string ? K : never) : never;
}[keyof T]

/** the name of a valid rule based on the return type of getRules */
export type RulesName<T> = ValidRuleKeys<typeof Rules, T>

/** either allow a rule name or a rule function */
export type RuleType<T> = (RulesName<T> | RuleFunction<T>)[]

function compareNumber(comparator: 'lt' | 'gt' | 'gte' | 'lte' | 'eq' | 'neq', nb: number): RuleFunction<number | undefined | null> {
  return (value: number | undefined | null) => {
    value ??= 0

    switch (comparator) {
    case 'eq':
      return value === nb || `Must equal ${nb}.`

    case 'neq':
      return value !== nb || `Must not be ${nb}.`

    case 'gt':
      return value > nb || `Greater than ${nb}.`

    case 'gte':
      return value >= nb || `At least ${nb}.`

    case 'lt':
      return value < nb || `Less than ${nb}.`

    case 'lte':
      return value <= nb || `At most ${nb}.`
    default:
      return `Invalid comparator`
    }
  }
}

export class Rules {
  static compareNumber = compareNumber

  static email = (value?: string | null): boolean | string => {
    if (!value)
      return true

    return (/^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|".+")@(?:\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|(?:[a-z\-0-9]+\.)+[a-z]{2,})$/i)
      .test(value) || 'Invalid email'
  }

  static isCode = (value?: string | null): boolean | string => {
    if (!value)
      return true

    return (/^[a-z_]+$/).test(value) || 'Must contain lowercase letters and underscores only'
  }

  static isDateBetweenHours = (minHour = 0, maxHour = 24, include = true) => (date?: Date | null) => {
    if (!date)
      return true

    const hour = date.getHours()

    return (include ? (hour >= minHour && hour <= maxHour) : (hour > minHour && hour < maxHour))
      || (include
        ? `Time must be between ${minHour}h and ${maxHour}h, inclusive`
        : `Time must be between ${minHour}h and ${maxHour}h`)
  }

  static isInteger = (strict = false) => (value?: string | number | null): boolean | string => {
    if (value === null || value === undefined)
      return true

    return (strict ? Number.isInteger(Number(value)) : Math.floor(Number(value)) === Number(value) * 1.0)
      || 'Must be an integer'
  }

  static isNumber = (value?: string | number | null): boolean | string => {
    if (value === null || value === undefined)
      return true

    return !Number.isNaN(Number(value)) || 'Nombre invalide'
  }

  static isSlug = (value?: string | null): boolean | string => {
    if (!value)
      return true

    return (/^[a-z0-9_]+$/).test(value) || 'Must contain lowercase letters, numbers, and underscores only'
  }

  static isWeekDay = (date?: Date | null) => {
    if (!date)
      return true

    return (date.getDay() >= 1 && date.getDay() <= 5) || 'Must be a weekday'
  }

  static lowercase = (value?: string | null): boolean | string => {
    if (!value)
      return true

    return value.toLowerCase() === value || 'Must be lowercase'
  }

  static isUrl = (str: string, secured = false): true | string => {
    try {
      const url = new URL(str)

      if (secured && url.protocol !== 'https:')
        return 'URL must use HTTPS'

      if (!['http:', 'https:'].includes(url.protocol))
        return 'Must be an HTTP or HTTPS URL'

      return true
    }
    catch {
      return 'Must be a valid URL'
    }
  }

  static max = (nb: number, eq = true) => compareNumber(eq ? 'lte' : 'lt', nb)

  static maxLength = (length: number) =>
    (value?: string | any[] | null) => {
      if (!value)
        return true

      return ((value?.length || 0) <= length) || `Max length is ${length} characters`
    }

  static min = (nb: number, eq = true) => compareNumber(eq ? 'gte' : 'gt', nb)

  static minLength = (length: number) =>
    (value?: string | any[] | null) => {
      if (!value)
        return true

      return ((value?.length || 0) >= length) || `Min length is ${length} characters`
    }

  static nonEmptyString = (value?: string | null): boolean | string => {
    if (!value)
      return 'Required'

    return value.trim().length > 0 || 'Required'
  }

  static nonZero = (value?: number | null): boolean | string => {
    if (typeof value === 'number')
      return (value !== 0) || 'Required'

    return Boolean(value) || 'Required'
  }

  static phone = (value?: string | number | null): boolean | string => {
    if (!value)
      return true

    return (/^(?:\+?33 ?|0)[1-9](?:[-. ]?\d{2}){4}$/).test(value.toString()) || 'Invalid phone number'
  }

  static required = (value?: any): boolean | string => {
    if (value === undefined || value === null)
      return 'Required'

    if (typeof value === 'number')
      return true

    if (Array.isArray(value))
      return value.length > 0 || 'Required'

    if (typeof value === 'string')
      return value.trim().length > 0 || 'Required'

    if (typeof value === 'object')
      return Object.keys(value).length > 0 || 'Required'

    return Boolean(value) || 'Required'
  }

  static isAfterDay = (date: Date, include = true) => (value?: Date | null) => {
    if (!value)
      return true

    const normalizedDate = new Date(date)

    normalizedDate.setHours(0, 0, 0, 0)

    const comparison = include
      ? value >= normalizedDate
      : value > normalizedDate

    return comparison || (include
      ? `Date must be on or after ${normalizedDate.toDateString()}`
      : `Date must be after ${normalizedDate.toDateString()}`)
  }

  static isAfterToday = (include = true) => (value?: Date | null) => {
    if (!value)
      return true

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const comparison = include
      ? value >= today
      : value > today

    return comparison || (include
      ? 'Date must be today or later'
      : 'Date must be after today')
  }

  static isBetweenDays = (minDate: Date, maxDate: Date, include = true) => (value?: Date | null) => {
    if (!value)
      return true

    const normalizedMinDate = new Date(minDate)

    normalizedMinDate.setHours(0, 0, 0, 0)

    const normalizedMaxDate = new Date(maxDate)

    normalizedMaxDate.setHours(0, 0, 0, 0)

    const comparison = include
      ? value >= normalizedMinDate && value <= normalizedMaxDate
      : value > normalizedMinDate && value < normalizedMaxDate

    const minDateStr = normalizedMinDate.toDateString()
    const maxDateStr = normalizedMaxDate.toDateString()

    return comparison || (include
      ? `Date must be between ${minDateStr} and ${maxDateStr}, inclusive`
      : `Date must be between ${minDateStr} and ${maxDateStr}`)
  }
}
