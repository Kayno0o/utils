export interface TranslationObject {
  [key: string]: string | TranslationObject
}

export type TranslationStructure<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends Record<string, any> ? TranslationStructure<T[K]> : never
}

// extract variables from string "{channel}" -> "channel"
type ExtractVariables<T extends string> = T extends `${string}{${infer Variable}}${infer Rest}`
  ? Variable | ExtractVariables<Rest>
  : never

type DotNotation<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${K & string}`
    : T[K] extends Record<string, any>
      ? DotNotation<T[K], `${Prefix}${K & string}.`>
      : never
}[keyof T]

// get value type from nested object using dot notation
type GetNestedValue<T, K extends string> = K extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? GetNestedValue<T[Key], Rest>
    : never
  : K extends keyof T
    ? T[K]
    : never

// extract variables only when value is string
type ExtractVariablesFromKey<T, K extends string> = GetNestedValue<T, K> extends string
  ? ExtractVariables<GetNestedValue<T, K>>
  : never

export function declareI18n<
  LocaleType extends string,
  Translations extends Record<LocaleType, TranslationObject>,
  PrimaryTranslation extends Translations[keyof Translations],
>(translations: Translations & Record<LocaleType, TranslationStructure<PrimaryTranslation>>) {
  // generate all possible keys using dot notation
  type I18nKey = DotNotation<PrimaryTranslation>

  // helper types for better overload resolution
  type KeysWithoutVariables = {
    [K in I18nKey]: GetNestedValue<PrimaryTranslation, K> extends string
      ? ExtractVariables<GetNestedValue<PrimaryTranslation, K>> extends never
        ? K
        : never
      : never
  }[I18nKey]

  type KeysWithVariables = {
    [K in I18nKey]: GetNestedValue<PrimaryTranslation, K> extends string
      ? ExtractVariables<GetNestedValue<PrimaryTranslation, K>> extends never
        ? never
        : K
      : never
  }[I18nKey]

  function getNestedValue<T, K extends string>(obj: T, key: K): GetNestedValue<T, K> {
    const keys = key.split('.')
    let current: any = obj
    for (const k of keys) {
      current = current?.[k]
    }
    return current
  }

  // keys that have NO variables - third parameter forbidden
  function t<K extends KeysWithoutVariables>(
    locale: LocaleType,
    key: K
  ): string

  // keys that HAVE variables - third parameter required
  function t<K extends KeysWithVariables>(
    locale: LocaleType,
    key: K,
    variables: Record<ExtractVariablesFromKey<PrimaryTranslation, K>, string | number>
  ): string

  function t<K extends I18nKey>(locale: LocaleType, key: K, variables?: Record<string, string | number>): string {
    const localeTranslations = translations[locale]

    let template = getNestedValue(localeTranslations, key) as string

    if (!template) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`)
      return key
    }

    // replace variables in template
    if (variables) {
      for (const [varName, value] of Object.entries(variables)) {
        template = template.replace(new RegExp(`\\{${varName}\\}`, 'g'), String(value))
      }
    }

    return template
  }

  return { t }
}
