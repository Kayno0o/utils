export function isString(val: any): val is string {
  return val !== null && typeof val === 'string'
}

export function isNumber(val: any): val is number {
  return val !== null && typeof val === 'number'
}

export function isObject(val: any): val is object {
  return val !== null && typeof val === 'object'
}

// eslint-disable-next-line ts/no-unsafe-function-type
export function isFunction(val: any): val is Function {
  return val !== null && typeof val === 'function'
}

export function isArray(val: any): val is any[] {
  return val !== null && Array.isArray(val)
}

export function isDate(val: any): val is Date {
  return val !== null && val instanceof Date
}

export function isPromise(val: any): val is Promise<any> {
  // eslint-disable-next-line github/no-then
  return val !== null && typeof val === 'object' && typeof val.then === 'function'
}
