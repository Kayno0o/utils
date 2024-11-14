import { dayjs, formatDate } from './dateUtils'

export type RuleFunction<T> = (arg: T) => boolean | string

type ValidRuleKeys<T, U> = {
  [K in keyof T]: T[K] extends RuleFunction<U> ? (ReturnType<T[K]> extends boolean | string ? K : never) : never;
}[keyof T]

/** the name of a valid rule based on the return type of getRules */
export type RulesName<T> = ValidRuleKeys<ReturnType<typeof getRules>, T>

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

export function getRules() {
  return {
    compareNumber,

    email: (value?: string | null): boolean | string => {
      if (!value)
        return true

      return /^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|".+")@(?:\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|(?:[a-z\-0-9]+\.)+[a-z]{2,})$/i
        .test(value) || 'Invalid email'
    },

    isAfterDay: (date: Date, include = true) => (value?: Date | null) => {
      if (!value)
        return true

      const formattedDate = () => formatDate(date, 'shortText')
      return (include ? dayjs(value).isSameOrAfter(dayjs(date), 'd') : dayjs(value).isAfter(dayjs(date), 'd'))
        || (include ? `Date must be on or after ${formattedDate()}` : `Date must be after ${formattedDate()}`)
    },

    isAfterToday: (include = true) => (value?: Date | null) => {
      if (!value)
        return true

      return (include ? dayjs(value).isSameOrAfter(dayjs(), 'd') : dayjs(value).isAfter(dayjs(), 'd'))
        || (include ? 'Date must be today or later' : 'Date must be after today')
    },

    isBetweenDays: (minDate: Date, maxDate: Date, include = true) => (value?: Date | null) => {
      if (!value)
        return true

      const minFormatted = formatDate(minDate, 'shortText')
      const maxFormatted = formatDate(maxDate, 'shortText')
      return (include
        ? (dayjs(value).isSameOrAfter(dayjs(minDate), 'd') && dayjs(value).isSameOrBefore(dayjs(maxDate), 'd'))
        : (dayjs(value).isAfter(dayjs(minDate), 'd') && dayjs(value).isBefore(dayjs(maxDate), 'd')))
      || (include
        ? `Date must be between ${minFormatted} and ${maxFormatted}, inclusive`
        : `Date must be between ${minFormatted} and ${maxFormatted}`)
    },

    isCode: (value?: string | null): boolean | string => {
      if (!value)
        return true

      return /^[a-z_]+$/.test(value) || 'Must contain lowercase letters and underscores only'
    },

    isDateBetweenHours: (minHour = 0, maxHour = 24, include = true) => (date?: Date | null) => {
      if (!date)
        return true

      const hour = date.getHours()
      return (include ? (hour >= minHour && hour <= maxHour) : (hour > minHour && hour < maxHour))
        || (include
          ? `Time must be between ${minHour}h and ${maxHour}h, inclusive`
          : `Time must be between ${minHour}h and ${maxHour}h`)
    },

    isInteger: (strict = false) => (value?: string | number | null): boolean | string => {
      if (value === null || value === undefined)
        return true

      return (strict ? Number.isInteger(Number(value)) : Math.floor(Number(value)) === Number(value) * 1.0)
        || 'Must be an integer'
    },
    isNumber: (value?: string | number | null): boolean | string => {
      if (value === null || value === undefined)
        return true

      return !Number.isNaN(Number(value)) || 'Nombre invalide'
    },

    isSlug: (value?: string | null): boolean | string => {
      if (!value)
        return true

      return /^[a-z0-9_]+$/.test(value) || 'Must contain lowercase letters, numbers, and underscores only'
    },
    isWeekDay: (date?: Date | null) => {
      if (!date)
        return true

      return (date.getDay() >= 1 && date.getDay() <= 5) || 'Must be a weekday'
    },

    lowercase: (value?: string | null): boolean | string => {
      if (!value)
        return true

      return value.toLowerCase() === value || 'Must be lowercase'
    },

    max: (nb: number, eq = true) => compareNumber(eq ? 'lte' : 'lt', nb),

    maxLength: (length: number) =>
      (value?: string | any[] | null) => {
        if (!value)
          return true
        return ((value?.length || 0) <= length) || `Max length is ${length} characters`
      },

    min: (nb: number, eq = true) => compareNumber(eq ? 'gte' : 'gt', nb),

    minLength: (length: number) =>
      (value?: string | any[] | null) => {
        if (!value)
          return true
        return ((value?.length || 0) >= length) || `Min length is ${length} characters`
      },

    nonEmptyString: (value?: string | null): boolean | string => {
      if (!value)
        return 'Required'

      return value.trim().length > 0 || 'Required'
    },

    nonZero: (value?: number | null): boolean | string => {
      if (typeof value === 'number')
        return (value !== 0) || 'Required'

      return !!value || 'Required'
    },

    phone: (value?: string | number | null): boolean | string => {
      if (!value)
        return true
      return /^(?:\+?33 ?|0)[1-9](?:[-. ]?\d{2}){4}$/.test(value.toString()) || 'Invalid phone number'
    },

    required: (value?: any): boolean | string => {
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

      return !!value || 'Required'
    },
  }
}
