export type Key = string | number | symbol

export type PartialRecord<T extends Key, U> = { [K in T]?: U }

export type ExcludeType<T, U> = {
  [K in keyof T]: T[K] extends U ? never : K;
}[keyof T]
