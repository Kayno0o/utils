export type RuleFunction<T> = (arg: T) => boolean | string

type ValidRuleKeys<T, U> = {
  [K in keyof T]: T[K] extends RuleFunction<U> ? (ReturnType<T[K]> extends boolean | string ? K : never) : never;
}[keyof T]

/** the name of a valid rule based on the return type of getRules */
export type RulesName<T> = ValidRuleKeys<typeof Rules, T>

/** either allow a rule name or a rule function */
export type RuleType<T> = (RulesName<T> | RuleFunction<T>)[]

/** A rule's error text, or a function building it from the rule's parameters. */
export type RuleMessage<P = void> = string | ((params: P) => string)

export interface RuleMessages {
  eq: RuleMessage<{ nb: number }>
  neq: RuleMessage<{ nb: number }>
  gt: RuleMessage<{ nb: number }>
  gte: RuleMessage<{ nb: number }>
  lt: RuleMessage<{ nb: number }>
  lte: RuleMessage<{ nb: number }>
  email: RuleMessage
  isCode: RuleMessage
  isDateBetweenHours: RuleMessage<{ minHour: number, maxHour: number, include: boolean }>
  isInteger: RuleMessage
  isNumber: RuleMessage
  isSlug: RuleMessage
  isWeekDay: RuleMessage
  lowercase: RuleMessage
  isUrl: RuleMessage
  isUrlSecured: RuleMessage
  isUrlProtocol: RuleMessage<{ protocols: string[] }>
  maxLength: RuleMessage<{ length: number }>
  minLength: RuleMessage<{ length: number }>
  phone: RuleMessage
  required: RuleMessage
  isAfterDay: RuleMessage<{ date: Date, include: boolean }>
  isAfterToday: RuleMessage<{ include: boolean }>
  isBetweenDays: RuleMessage<{ minDate: Date, maxDate: Date, include: boolean }>
}

const DEFAULT_URL_PROTOCOLS = ['http:', 'https:']

const DEFAULT_RULE_MESSAGES: RuleMessages = {
  eq: ({ nb }) => `Must equal ${nb}.`,
  neq: ({ nb }) => `Must not be ${nb}.`,
  gt: ({ nb }) => `Greater than ${nb}.`,
  gte: ({ nb }) => `At least ${nb}.`,
  lt: ({ nb }) => `Less than ${nb}.`,
  lte: ({ nb }) => `At most ${nb}.`,
  email: 'Invalid email',
  isCode: 'Must contain lowercase letters and underscores only',
  isDateBetweenHours: ({ minHour, maxHour, include }) => include
    ? `Time must be between ${minHour}h and ${maxHour}h, inclusive`
    : `Time must be between ${minHour}h and ${maxHour}h`,
  isInteger: 'Must be an integer',
  isNumber: 'Must be a number',
  isSlug: 'Must contain lowercase letters, numbers, and underscores only',
  isWeekDay: 'Must be a weekday',
  lowercase: 'Must be lowercase',
  isUrl: 'Must be a valid URL',
  isUrlSecured: 'URL must use HTTPS',
  isUrlProtocol: ({ protocols }) => protocols.join() === DEFAULT_URL_PROTOCOLS.join()
    ? 'Must be an HTTP or HTTPS URL'
    : `URL must use ${protocols.join(' or ')}`,
  maxLength: ({ length }) => `Max length is ${length} characters`,
  minLength: ({ length }) => `Min length is ${length} characters`,
  phone: 'Invalid phone number',
  required: 'Required',
  isAfterDay: ({ date, include }) => include
    ? `Date must be on or after ${date.toDateString()}`
    : `Date must be after ${date.toDateString()}`,
  isAfterToday: ({ include }) => include ? 'Date must be today or later' : 'Date must be after today',
  isBetweenDays: ({ minDate, maxDate, include }) => include
    ? `Date must be between ${minDate.toDateString()} and ${maxDate.toDateString()}, inclusive`
    : `Date must be between ${minDate.toDateString()} and ${maxDate.toDateString()}`,
}

let ruleMessages: RuleMessages = { ...DEFAULT_RULE_MESSAGES }

function say<K extends keyof RuleMessages>(key: K, ...[params]: RuleMessages[K] extends RuleMessage<infer P> ? (P extends void ? [] : [P]) : never): string {
  const message = ruleMessages[key] as RuleMessage<unknown>

  return typeof message === 'function' ? message(params) : message
}

const EMAIL_REGEX = /^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|".+")@(?:\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|(?:[a-z\-0-9]+\.)+[a-z]{2,})$/i
const CODE_REGEX = /^[a-z_]+$/
const SLUG_REGEX = /^[a-z0-9_]+$/
const PHONE_SEPARATORS_REGEX = /[\s.()-]/g

/** `FR` takes French numbers, national or `+33`; `E164` an international `+` number, separators allowed. */
export const PHONE_FORMATS = {
  FR: /^(?:\+?33 ?|0)[1-9](?:[-. ]?\d{2}){4}$/,
  E164: /^\+[1-9]\d{6,14}$/,
}

export type PhoneFormat = keyof typeof PHONE_FORMATS | RegExp

export interface IsUrlOptions {
  /** Accepted `URL.protocol` values, colon included. Defaults to `http:` and `https:`. */
  protocols?: string[]
}

function compareNumber(comparator: 'lt' | 'gt' | 'gte' | 'lte' | 'eq' | 'neq', nb: number): RuleFunction<number | undefined | null> {
  return (value: number | undefined | null) => {
    value ??= 0

    switch (comparator) {
      case 'eq':
        return value === nb || say('eq', { nb })

      case 'neq':
        return value !== nb || say('neq', { nb })

      case 'gt':
        return value > nb || say('gt', { nb })

      case 'gte':
        return value >= nb || say('gte', { nb })

      case 'lt':
        return value < nb || say('lt', { nb })

      case 'lte':
        return value <= nb || say('lte', { nb })
      default:
        return `Invalid comparator`
    }
  }
}

export class Rules {
  static compareNumber = compareNumber

  /** Replaces some or all of the default messages, e.g. with translations; later rule calls use them. */
  static setMessages = (messages: Partial<RuleMessages>): void => {
    ruleMessages = { ...ruleMessages, ...messages }
  }

  /** Puts every message back to its English default. */
  static resetMessages = (): void => {
    ruleMessages = { ...DEFAULT_RULE_MESSAGES }
  }

  /** Wraps any rule so a failure reads `message` instead, built from the value when a function. */
  static withMessage = <T>(rule: RuleFunction<T>, message: string | ((value: T) => string)): RuleFunction<T> => (value: T) => {
    const result = rule(value)

    if (typeof result !== 'string')
      return result

    return typeof message === 'function' ? message(value) : message
  }

  static email = (value?: string | null): boolean | string => {
    if (!value)
      return true

    return EMAIL_REGEX.test(value) || say('email')
  }

  static isCode = (value?: string | null): boolean | string => {
    if (!value)
      return true

    return CODE_REGEX.test(value) || say('isCode')
  }

  static isDateBetweenHours = (minHour = 0, maxHour = 24, include = true) => (date?: Date | null) => {
    if (!date)
      return true

    const hour = date.getHours()

    return (include ? (hour >= minHour && hour <= maxHour) : (hour > minHour && hour < maxHour))
      || say('isDateBetweenHours', { minHour, maxHour, include })
  }

  static isInteger = (strict = false) => (value?: string | number | null): boolean | string => {
    if (value === null || value === undefined)
      return true

    return (strict ? Number.isInteger(Number(value)) : Math.floor(Number(value)) === Number(value) * 1.0)
      || say('isInteger')
  }

  static isNumber = (value?: string | number | null): boolean | string => {
    if (value === null || value === undefined)
      return true

    return !Number.isNaN(Number(value)) || say('isNumber')
  }

  static isSlug = (value?: string | null): boolean | string => {
    if (!value)
      return true

    return SLUG_REGEX.test(value) || say('isSlug')
  }

  static isWeekDay = (date?: Date | null) => {
    if (!date)
      return true

    return (date.getDay() >= 1 && date.getDay() <= 5) || say('isWeekDay')
  }

  static lowercase = (value?: string | null): boolean | string => {
    if (!value)
      return true

    return value.toLowerCase() === value || say('lowercase')
  }

  /** `secured` alone requires `https:`; options pick the accepted protocols. */
  static isUrl = (str: string, secured: boolean | IsUrlOptions = false): true | string => {
    try {
      const url = new URL(str)

      if (secured === true && url.protocol !== 'https:')
        return say('isUrlSecured')

      const protocols = (typeof secured === 'object' && secured.protocols) || DEFAULT_URL_PROTOCOLS

      if (!protocols.includes(url.protocol))
        return say('isUrlProtocol', { protocols })

      return true
    }
    catch {
      return say('isUrl')
    }
  }

  static max = (nb: number, eq = true) => compareNumber(eq ? 'lte' : 'lt', nb)

  static maxLength = (length: number) =>
    (value?: string | any[] | null) => {
      if (!value)
        return true

      return ((value?.length || 0) <= length) || say('maxLength', { length })
    }

  static min = (nb: number, eq = true) => compareNumber(eq ? 'gte' : 'gt', nb)

  static minLength = (length: number) =>
    (value?: string | any[] | null) => {
      if (!value)
        return true

      return ((value?.length || 0) >= length) || say('minLength', { length })
    }

  static nonEmptyString = (value?: string | null): boolean | string => {
    return !value ? say('required') : value.trim().length > 0 || say('required')
  }

  static nonZero = (value?: number | null): boolean | string => {
    return typeof value === 'number' ? (value !== 0) || say('required') : Boolean(value) || say('required')
  }

  /** French numbers by default; `format` takes `E164` or a pattern of your own. */
  static phone = (value?: string | number | null, format: PhoneFormat = 'FR'): boolean | string => {
    if (!value)
      return true

    const text = value.toString()
    const valid = format === 'E164'
      ? PHONE_FORMATS.E164.test(text.replace(PHONE_SEPARATORS_REGEX, ''))
      : (typeof format === 'string' ? PHONE_FORMATS[format] : format).test(text)

    return valid || say('phone')
  }

  static required = (value?: any): boolean | string => {
    if (value === undefined || value === null)
      return say('required')

    if (typeof value === 'number')
      return true

    if (Array.isArray(value))
      return value.length > 0 || say('required')

    if (typeof value === 'string')
      return value.trim().length > 0 || say('required')

    return typeof value === 'object' ? Object.keys(value).length > 0 || say('required') : Boolean(value) || say('required')
  }

  static isAfterDay = (date: Date, include = true) => (value?: Date | null) => {
    if (!value)
      return true

    const normalizedDate = new Date(date)

    normalizedDate.setHours(0, 0, 0, 0)

    const comparison = include
      ? value >= normalizedDate
      : value > normalizedDate

    return comparison || say('isAfterDay', { date: normalizedDate, include })
  }

  static isAfterToday = (include = true) => (value?: Date | null) => {
    if (!value)
      return true

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    const comparison = include
      ? value >= today
      : value > today

    return comparison || say('isAfterToday', { include })
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

    return comparison || say('isBetweenDays', { minDate: normalizedMinDate, maxDate: normalizedMaxDate, include })
  }
}
