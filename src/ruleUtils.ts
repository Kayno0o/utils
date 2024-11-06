import type { RecursiveKeyOf } from './types'
import { dayjs, formatDate } from './dateUtils'

export type RuleFunction<T> = (arg: T) => boolean | string

type ValidRuleKeys<T, U> = {
  [K in keyof T]: T[K] extends RuleFunction<U> ? (ReturnType<T[K]> extends boolean | string ? K : never) : never;
}[keyof T]

/** the name of a valid rule based on the return type of getRules */
export type RulesName<T> = ValidRuleKeys<ReturnType<typeof getRules>, T>

/** either allow a rule name or a rule function */
export type RuleType<T> = (RulesName<T> | RuleFunction<T>)[]

export const rulesTranslations = {
  rules: {
    'compareNumber': {
      eq: 'La valeur doit être égale à {nb}.',
      gt: 'La valeur doit être supérieure à {nb}.',
      gte: 'La valeur doit être supérieure ou égale à {nb}.',
      invalid: 'Condition invalide',
      lt: 'La valeur doit être inférieure à {nb}.',
      lte: 'La valeur doit être inférieure ou égale à {nb}.',
      neq: 'La valeur ne doit pas être égale à {nb}.',
    },
    'email': 'Email invalide',
    'isAfterDay': 'La date doit être après le {date}.',
    'isAfterDay.include': 'La date doit être après ou égale au {date}.',
    'isAfterToday': 'La date doit être après aujourd\'hui.',
    'isAfterToday.include': 'La date doit être après ou égale à aujourd\'hui.',
    'isBetweenDays': 'La date doit être comprise entre le {minDate} et le {maxDate}.',
    'isBetweenDays.include': 'La date doit être comprise entre le {minDate} et le {maxDate} inclus.',
    'isCode': 'La valeur ne peut contenir que des lettres minuscules sans accents et le caractère « _ »',
    'isDateBetweenHours': 'L\'heure doit être comprise entre {minHour}h et {maxHour}h.',
    'isDateBetweenHours.include': 'L\'heure doit être comprise entre {minHour}h et {maxHour}h inclus.',
    'isInteger': 'Nombre entier requis',
    'isNumber': 'Nombre invalide',
    'isSlug': 'La valeur ne peut contenir que des lettres minuscules sans accents, chiffres et « _ »',
    'isWeekDay': 'Le jour doit être un jour de semaine.',
    'lowercase': 'La valeur doit être en minuscules',
    'maxLength': 'Valeur trop longue : {length} caractères maximum.',
    'minLength': 'Valeur trop courte : {length} caractères requis.',
    'phone': 'Numéro invalide',
    'required': 'Champ requis',
  },
}

export function translateRules(key: RecursiveKeyOf<typeof rulesTranslations>, params?: Record<string | number, string | number>): string {
  let output: object | string = rulesTranslations

  for (const k of key.split('.')) {
    if (typeof output === 'string')
      break

    if (output && k in output)
      output = output[k as keyof typeof output]
  }

  if (typeof output !== 'string')
    return key

  output = output as string

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      output = output.replace(new RegExp(`{${k}}`, 'g'), v.toString())
    }
  }

  return output
}

function compareNumber(t: typeof translateRules) {
  return (comparator: 'lt' | 'gt' | 'gte' | 'lte' | 'eq' | 'neq', nb: number): RuleFunction<number | undefined | null> => {
    return (value: number | undefined | null) => {
      value ??= 0
      switch (comparator) {
        case 'eq':
          return value === nb || t('rules.compareNumber.eq', { nb })
        case 'neq':
          return value !== nb || t('rules.compareNumber.neq', { nb })
        case 'gt':
          return value > nb || t('rules.compareNumber.gt', { nb })
        case 'gte':
          return value >= nb || t('rules.compareNumber.gte', { nb })
        case 'lt':
          return value < nb || t('rules.compareNumber.lt', { nb })
        case 'lte':
          return value <= nb || t('rules.compareNumber.lte', { nb })
        default:
          return t('rules.compareNumber.invalid')
      }
    }
  }
}

export function getRules() {
  const t = translateRules

  const translatedCompareNumber = compareNumber(t)

  return {
    compareNumber: translatedCompareNumber,

    email: (value?: string | null): boolean | string => {
      if (!value)
        return true

      return /^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|".+")@(?:\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|(?:[a-z\-0-9]+\.)+[a-z]{2,})$/i
        .test(value) || t('rules.email')
    },

    isAfterDay: (date: Date, include = true) => (value?: Date | null) => {
      if (!value)
        return true

      if (include)
        return dayjs(value).isSameOrAfter(dayjs(date), 'd') || t('rules.isAfterDay.include', { date: formatDate(date, 'shortText') })
      return dayjs(value).isAfter(dayjs(date), 'd') || t('rules.isAfterDay', { date: formatDate(date, 'shortText') })
    },

    isAfterToday: (include = true) => (value?: Date | null) => {
      if (!value)
        return true

      if (include)
        return dayjs(value).isSameOrAfter(dayjs(), 'd') || t('rules.isAfterToday.include')
      return dayjs(value).isAfter(dayjs(), 'd') || t('rules.isAfterToday')
    },

    isBetweenDays: (minDate: Date, maxDate: Date, include = true) => (value?: Date | null) => {
      if (!value)
        return true

      if (include) {
        return (dayjs(value).isSameOrAfter(dayjs(minDate), 'd') && dayjs(value).isSameOrBefore(dayjs(maxDate), 'd'))
          || t('rules.isBetweenDays.include', { maxDate: formatDate(maxDate, 'shortText'), minDate: formatDate(minDate, 'shortText') })
      }
      return (dayjs(value).isAfter(dayjs(minDate), 'd') && dayjs(value).isBefore(dayjs(maxDate), 'd'))
        || t('rules.isBetweenDays', { maxDate: formatDate(maxDate, 'shortText'), minDate: formatDate(minDate, 'shortText') })
    },

    isCode: (value?: string | null): boolean | string => {
      if (!value)
        return true

      return /^[a-z_]+$/.test(value) || t('rules.isCode')
    },

    isDateBetweenHours: (minHour = 0, maxHour = 24, include = true) => (date?: Date | null) => {
      if (!date)
        return true

      const hour = date.getHours()
      if (include)
        return (hour >= minHour && hour <= maxHour) || t('rules.isDateBetweenHours.include', { maxHour, minHour })
      return (hour > minHour && hour < maxHour) || t('rules.isDateBetweenHours', { maxHour, minHour })
    },

    isInteger: (strict = false) => (value?: string | number | null): boolean | string => {
      if (value === null || value === undefined)
        return true

      return (strict ? Number.isInteger(Number(value)) : Math.floor(Number(value)) === Number(value) * 1.0) || t('rules.isInteger')
    },
    isNumber: (value?: string | number | null): boolean | string => {
      if (value === null || value === undefined)
        return true

      return !Number.isNaN(Number(value)) || t('rules.isNumber')
    },

    isSlug: (value?: string | null): boolean | string => {
      if (!value)
        return true

      return /^[a-z0-9_]+$/.test(value) || t('rules.isSlug')
    },
    isWeekDay: (date?: Date | null) => {
      if (!date)
        return true

      return (date.getDay() >= 1 && date.getDay() <= 5) || t('rules.isWeekDay')
    },

    lowercase: (value?: string | null): boolean | string => {
      if (!value)
        return true

      return value.toLowerCase() === value || t('rules.lowercase')
    },

    max: (nb: number, eq = true) => translatedCompareNumber(eq ? 'lte' : 'lt', nb),

    maxLength: (length: number) =>
      (value?: string | any[] | null) => {
        if (!value)
          return true
        return ((value?.length || 0) <= length) || t('rules.maxLength', { length })
      },

    min: (nb: number, eq = true) => translatedCompareNumber(eq ? 'gte' : 'gt', nb),

    minLength: (length: number) =>
      (value?: string | any[] | null) => {
        if (!value)
          return true
        return ((value?.length || 0) >= length) || t('rules.minLength', { length })
      },

    nonEmptyString: (value?: string | null): boolean | string => {
      if (!value)
        return t('rules.required')

      return value.trim().length > 0 || t('rules.required')
    },

    nonZero: (value?: number | null): boolean | string => {
      if (typeof value === 'number')
        return (value !== 0) || t('rules.required')

      return !!value || t('rules.required')
    },

    phone: (value?: string | number | null): boolean | string => {
      if (!value)
        return true
      return /^(?:\+?33 ?|0)[1-9](?:[-. ]?\d{2}){4}$/.test(value.toString()) || t('rules.phone')
    },

    required: (value?: any): boolean | string => {
      if (value === undefined || value === null)
        return t('rules.required')

      if (typeof value === 'number')
        return true

      if (Array.isArray(value))
        return value.length > 0 || t('rules.required')

      if (typeof value === 'string')
        return value.trim().length > 0 || t('rules.required')

      if (typeof value === 'object')
        return Object.keys(value).length > 0 || t('rules.required')

      return !!value || t('rules.required')
    },
  }
}
