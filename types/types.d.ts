export {}

declare global {
  type Key = string | number | symbol

   type PartialRecord<T extends Key, U> = Partial<Record<T, U>>

   type ExcludeType<T, U> = {
     [K in keyof T]: T[K] extends U ? never : K;
   }[keyof T]

   type KeyOf<T> = {
     [K in keyof T & (string | number)]: T[K] extends object ? `${K}` | `${K}.${KeyOf<T[K]>}` : `${K}`;
   }[keyof T & (string | number)]

   type RecursiveKeyOf<TObj extends object> = {
     [TKey in keyof TObj & (string | number)]:
     RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`>;
   }[keyof TObj & (string | number)]

   type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>

   type MaybePromise<T> = T | Promise<T>

   type RecursivePartial<T> = {
     [P in keyof T]?:
     T[P] extends (infer U)[] ? RecursivePartial<U>[] :
       T[P] extends object | undefined ? RecursivePartial<T[P]> :
         T[P];
   }

   type FunctionKeys<T> = { [K in keyof T]: T[K] extends (...args: any[]) => Style ? K : never }[keyof T]
   type NonFunctionKeys<T> = { [K in keyof T]: T[K] extends (...args: any[]) => Style ? never : K }[keyof T]
}

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
