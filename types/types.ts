export type Key = string | number | symbol

export type PartialRecord<T extends Key, U> = Partial<Record<T, U>>

export type ExcludeType<T, U> = {
  [K in keyof T]: T[K] extends U ? never : K;
}[keyof T]

export type KeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object ? `${K}` | `${K}.${KeyOf<T[K]>}` : `${K}`;
}[keyof T & (string | number)]

export type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]:
  RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`>;
}[keyof TObj & (string | number)]

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]:
  RecursiveKeyOfHandleValue<TObj[TKey], `.${TKey}`>;
}[keyof TObj & (string | number)]

type RecursiveKeyOfHandleValue<TValue, Text extends string> =
  TValue extends any[] ? Text :
    TValue extends object
      ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
      : Text

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

export type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>

export type MaybePromise<T> = T | Promise<T>
export type MaybeArray<T> = T | T[]

export type RecursivePartial<T> = {
  [P in keyof T]?:
  T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object | undefined ? RecursivePartial<T[P]> :
      T[P];
}

// eslint-disable-next-line ts/no-unsafe-function-type
export type FunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
// eslint-disable-next-line ts/no-unsafe-function-type
export type NonFunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]

export type DotNotation<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${K & string}`
    : T[K] extends Record<string, any>
      ? DotNotation<T[K], `${Prefix}${K & string}.`>
      : never
}[keyof T]

/* eslint-disable ts/no-empty-object-type */
export type ExtractParams<T extends string, Type = string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Record<Param, Type> & ExtractParams<Rest>
    : {}

export type HasKeys<T> = keyof T extends never ? false : true
