export type Key = string | number | symbol

export type PartialRecord<T extends Key, U> = { [K in T]?: U }

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
