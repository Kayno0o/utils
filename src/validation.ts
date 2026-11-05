import { STRICT_IPV4_REGEX, STRICT_IPV6_REGEX, STRICT_UUID_REGEX } from './regex'

export function isString(val: unknown): val is string {
  return typeof val === 'string'
}

export function isNumber(val: unknown): val is number {
  return typeof val === 'number'
}

export function isObject(val: unknown): val is object {
  return val !== null && typeof val === 'object'
}

// eslint-disable-next-line ts/no-unsafe-function-type
export function isFunction(val: unknown): val is Function {
  return typeof val === 'function'
}

export function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val)
}

export function isDate(val: unknown): val is Date {
  return val instanceof Date
}

export function isPromise(val: unknown): val is Promise<unknown> {
  // eslint-disable-next-line kaynooo/no-then
  return val !== null && typeof val === 'object' && typeof (val as { then?: unknown }).then === 'function'
}

export function isUUID(val: string): boolean {
  return STRICT_UUID_REGEX.test(val)
}

export function isIP(val: string, { version = 4 }: { version?: 4 | 6 } = {}): boolean {
  return version === 4 ? STRICT_IPV4_REGEX.test(val) : STRICT_IPV6_REGEX.test(val)
}
