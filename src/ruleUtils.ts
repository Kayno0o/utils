export type RuleFunction<T> = (arg: T) => boolean | string

type ValidRuleKeys<T, U> = {
  [K in keyof T]: T[K] extends RuleFunction<U> ? (ReturnType<T[K]> extends boolean | string ? K : never) : never;
}[keyof T]

/** the name of a valid rule based on the return type of getRules */
export type RulesName<T> = ValidRuleKeys<typeof rules, T>

/** either allow a rule name or a rule function */
export type RuleType<T> = (RulesName<T> | RuleFunction<T>)[]

/** Retrieves a set of validation rules */
function compareNumber(comparator: 'lt' | 'gt' | 'gte' | 'lte' | 'eq' | 'neq', nb: number): RuleFunction<number | undefined | null> {
  return (value: number | undefined | null) => {
    value ??= 0
    switch (comparator) {
      case 'eq':
        return value === nb || `La valeur doit être égale à ${nb}.`
      case 'neq':
        return value !== nb || `La valeur ne doit pas être égale à ${nb}.`
      case 'gt':
        return value > nb || `La valeur doit être supérieure à ${nb}.`
      case 'gte':
        return value >= nb || `La valeur doit être supérieure ou égale à ${nb}.`
      case 'lt':
        return value < nb || `La valeur doit être inferieure à ${nb}.`
      case 'lte':
        return value <= nb || `La valeur doit être inferieure ou égale à ${nb}.`
      default:
        return 'Condition invalide'
    }
  }
}

export const rules = {
  compareNumber,

  email: (value?: string | null): boolean | string => {
    if (!value)
      return true

    return /^(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*|".+")@(?:\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|(?:[a-z\-0-9]+\.)+[a-z]{2,})$/i
      .test(value) || 'Email invalide'
  },

  isNumber: (value?: string | number | null): boolean | string => {
    if (value === null || value === undefined)
      return true

    return !Number.isNaN(Number(value)) || 'Nombre invalide'
  },

  isSlug: (value?: string | null): boolean | string => {
    if (!value)
      return true

    return /^[a-z0-9_]+$/.test(value) || 'La valeur ne peut contenir que des chiffres, lettres et \'_\''
  },

  lowercase: (value?: string | null): boolean | string => {
    if (!value)
      return true

    return value.toLowerCase() === value || 'La valeur doit être en minuscules'
  },

  max: (nb: number, eq = true) => compareNumber(eq ? 'lte' : 'lt', nb),
  maxLength: (length: number) =>
    (value?: string | any[] | null) => {
      if (!value)
        return true
      return ((value?.length || 0) <= length) || `Valeur trop longue : ${length} caractères maximum.`
    },

  min: (nb: number, eq = true) => compareNumber(eq ? 'gte' : 'gt', nb),
  minLength: (length: number) =>
    (value?: string | any[] | null) => {
      if (!value)
        return true
      return ((value?.length || 0) >= length) || `Valeur trop courte : ${length} caractères requis.`
    },

  nonEmptyString: (value?: string | null): boolean | string => {
    if (!value)
      return 'Champ requis'

    return value.trim().length > 0 || 'Champ requis'
  },

  nonZero: (value?: number | null): boolean | string => {
    if (typeof value === 'number')
      return (value !== 0) || 'Champ requis'

    return !!value || 'Champ requis'
  },

  phone: (value?: string | number | null): boolean | string => {
    if (!value)
      return true
    return /^(?:\+?33 ?|0)[1-9](?:[-. ]?\d{2}){4}$/.test(value.toString()) || 'Numéro invalide'
  },

  required: (value?: any): boolean | string => {
    if (value === undefined || value === null)
      return 'Champ requis'

    if (typeof value === 'number')
      return true

    if (Array.isArray(value))
      return value.length > 0 || 'Champ requis'

    if (typeof value === 'string')
      return value.trim().length > 0 || 'Champ requis'

    return !!value || 'Champ requis'
  },
}
