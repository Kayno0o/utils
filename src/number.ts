import { sfc32, xmur3 } from './crypto'

const arr32 = new Uint32Array(1)

export function randomInt(min: number, max: number, isCrypto?: boolean): number
export function randomInt(max: number, isCrypto?: boolean): number

export function randomInt(minOrMax: number, max?: number | boolean, isCrypto?: boolean) {
  if (typeof max === 'boolean')
    isCrypto = max
  isCrypto ??= false

  const getRandomValue = isCrypto
    ? () => crypto.getRandomValues(arr32)[0]! / 2 ** 32
    : Math.random

  const min = (typeof max !== 'number') ? 0 : minOrMax
  const range = (typeof max !== 'number') ? minOrMax : max - minOrMax

  return Math.floor(getRandomValue() * range) + min
}

/** @see https://processing.org/reference/map_.html */
export function map(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
}

export function round(nb: number, precision = 2) {
  return Math.round(nb * (10 ** precision)) / (10 ** precision)
}

export function range(minOrMax: number, max?: number): number[] {
  if (max === undefined) {
    max = minOrMax
    minOrMax = 0
  }

  return Array.from({ length: max - minOrMax }, (_, i) => i + minOrMax)
}

export function numberFromString(
  str: string,
  min: number,
  max: number,
  { integer = true }: { integer?: boolean } = {},
): number {
  const seed = xmur3(str)
  const rand = sfc32(seed(), seed(), seed(), seed())
  const r = rand()

  if (integer) {
    return Math.floor(r * (max - min + 1)) + min
  }

  return min + r * (max - min)
}
