import type { RandomSource } from '../number'
import { sfc32, xmur3 } from '../crypto'
import { getDaysInMonth, pad } from '../date'
import { capitalize } from '../text'

const LOREM_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'proin', 'ultricies', 'sed', 'dui', 'scelerisque', 'donec', 'pellentesque', 'diam', 'vel', 'ligula', 'efficitur']

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor']

const ADJECTIVES = ['quick', 'bright', 'massive', 'ancient', 'fragile', 'smooth', 'silent', 'fierce', 'colorful', 'mysterious', 'epic', 'stealthy', 'legendary', 'agile', 'immersive']
const OBJECTS = ['table', 'mountain', 'lamp', 'book', 'window', 'river', 'cloud', 'carpet', 'bottle', 'clock', 'controller', 'sword', 'avatar', 'quest', 'dungeon', 'rocket']

const EMAIL_PROVIDERS = ['gmail.com', 'yahoo.com', 'orange.fr']
const UUID_V4_TEMPLATE = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
const UUID_PLACEHOLDER_REGEX = /[xy]/g
const SPACE_REGEX = / /g
const LEADING_AT_REGEX = /^@/

export interface FakerOptions {
  /** Makes every call deterministic, for fixtures and snapshots. */
  seed?: string | number
  /** A random source in `[0, 1)`, taking precedence over `seed`. Defaults to `Math.random`; pass `cryptoRandom` for secrets. */
  random?: RandomSource
  firstNames?: readonly string[]
  lastNames?: readonly string[]
  /** Domains for `internet.email`, with or without a leading `@`. */
  emailProviders?: readonly string[]
  /** Words `name.username` pairs, adjective first. */
  adjectives?: readonly string[]
  objects?: readonly string[]
}

/** A faker with its own random source and word lists; `Faker` is the unseeded default one. */
export function createFaker({
  seed,
  random,
  firstNames = FIRST_NAMES,
  lastNames = LAST_NAMES,
  emailProviders = EMAIL_PROVIDERS,
  adjectives = ADJECTIVES,
  objects = OBJECTS,
}: FakerOptions = {}) {
  const hash = seed === undefined ? undefined : xmur3(String(seed))
  const next = random ?? (hash ? sfc32(hash(), hash(), hash(), hash()) : Math.random)

  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min))
  const pick = <T>(values: readonly T[]): T => values[int(0, values.length)]!

  const lorem = {
    paragraph: (length = 1, dictionary = LOREM_WORDS): string =>
      Array.from({ length: Math.max(1, length) }, () => lorem.sentence(int(3, 7), dictionary)).join('\n'),
    sentence: (length = 1, dictionary = LOREM_WORDS): string =>
      Array.from({ length: Math.max(1, length) }, () => {
        const sentence = lorem.word(int(5, 15), dictionary).replace(SPACE_REGEX, () => next() < 0.1 ? ', ' : ' ')

        return `${capitalize(sentence)}.`
      }).join(' '),
    word: (length = 1, dictionary = LOREM_WORDS): string =>
      Array.from({ length: Math.max(1, length) }, () => pick(dictionary)).join(' '),
  }

  const date = {
    date: ({ endYear = new Date().getFullYear() + 4, startYear = new Date().getFullYear() - 4 }: { endYear?: number, startYear?: number } = {}): string => {
      const year = Number(date.year({ endYear, startYear }))
      const month = Number(date.month())
      const day = int(1, getDaysInMonth(month, year) + 1)

      return `${year}-${pad(month)}-${pad(day)}`
    },
    month: (): string => pad(int(1, 13)),
    year: ({ endYear = new Date().getFullYear() + 4, startYear = new Date().getFullYear() - 4 }: { endYear?: number, startYear?: number } = {}): string =>
      int(startYear, endYear + 1).toString(),
  }

  const name = {
    firstName: (): string => pick(firstNames),
    fullname: (): string => `${name.firstName()} ${name.lastName()}`,
    lastName: (): string => pick(lastNames),
    username: (): string => capitalize(pick(adjectives)) + capitalize(pick(objects)),
  }

  const internet = {
    email: (): string => `${name.fullname().toLocaleLowerCase().replace(SPACE_REGEX, '.')}@${pick(emailProviders).replace(LEADING_AT_REGEX, '')}`,
  }

  const datatype = {
    uuidV4: (): string => UUID_V4_TEMPLATE.replace(UUID_PLACEHOLDER_REGEX, (c) => {
      const r = int(0, 16)

      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    }),
  }

  return { lorem, date, name, internet, datatype }
}

export type FakerInstance = ReturnType<typeof createFaker>

const defaultFaker = createFaker()

export class Faker {
  static lorem = defaultFaker.lorem
  static date = defaultFaker.date
  static name = defaultFaker.name
  static internet = defaultFaker.internet
  static datatype = defaultFaker.datatype
}
