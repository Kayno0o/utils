import { getRandomElement } from './arrayUtils'
import { getDaysInMonth } from './dateUtils'
import { randomInt } from './numberUtils'
import { firstUpper } from './textUtils'

export class Faker {
  private static LOREM_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'proin', 'ultricies', 'sed', 'dui', 'scelerisque', 'donec', 'pellentesque', 'diam', 'vel', 'ligula', 'efficitur']

  static lorem = Object.assign(
    ({ isCrypto = false, length = 5, type }: {
      isCrypto?: boolean
      length?: number
      type: 'word' | 'sentence' | 'paragraph'
    }): string => {
      length = Math.max(1, length)

      switch (type) {
        case 'word': return Faker.lorem.word(length, isCrypto)
        case 'sentence': return Faker.lorem.sentence(length, isCrypto)
        case 'paragraph': return Faker.lorem.paragraph(length, isCrypto)
      }
    },
    {
      paragraph: (length = 1, isCrypto = false): string =>
        Array.from({ length: Math.max(1, length) }, () => {
          const count = randomInt(3, 7, isCrypto)
          return Faker.lorem.sentence(count, isCrypto)
        }).join('\n'),
      sentence: (length = 1, isCrypto = false): string =>
        Array.from({ length: Math.max(1, length) }, () => {
          const count = randomInt(5, 15, isCrypto)
          const sentence = Faker.lorem.word(count, isCrypto).replace(/ /g, () => Math.random() < 0.1 ? ', ' : ' ')

          return `${firstUpper(sentence)}.`
        }).join(' '),
      word: (length = 1, isCrypto = false): string =>
        Array.from({ length: Math.max(1, length) }, () => getRandomElement(Faker.LOREM_WORDS, isCrypto)).join(' '),
    },
  )

  static date = Object.assign(
    ({
      endYear = new Date().getFullYear() + 4,
      startYear = new Date().getFullYear() - 4,
    }: {
      endYear?: number
      startYear?: number
    } = {}): string => {
      const year = Number(Faker.date.year({ endYear, startYear }))
      const month = Number(Faker.date.month())
      const daysInMonth = getDaysInMonth(year, month)

      const day = Math.floor(Math.random() * daysInMonth) + 1
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    },
    {
      month: (): string => {
        const month = Math.floor(Math.random() * 12) + 1
        return month.toString().padStart(2, '0')
      },
      year: ({ endYear = new Date().getFullYear() + 4, startYear = new Date().getFullYear() - 4 }: { endYear?: number, startYear?: number } = {}): string => {
        const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
        return year.toString()
      },
    },
  )

  private static FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah']
  private static LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor']

  private static ADJECTIVES = ['quick', 'bright', 'massive', 'ancient', 'fragile', 'smooth', 'silent', 'fierce', 'colorful', 'mysterious', 'epic', 'stealthy', 'legendary', 'agile', 'immersive']
  private static OBJECTS = ['table', 'mountain', 'lamp', 'book', 'window', 'river', 'cloud', 'carpet', 'bottle', 'clock', 'controller', 'sword', 'avatar', 'quest', 'dungeon', 'rocket']

  static name = {
    firstName: () => getRandomElement(Faker.FIRST_NAMES),
    fullname: () => `${Faker.name.firstName()} ${Faker.name.lastName()}`,
    lastName: () => getRandomElement(Faker.LAST_NAMES),
    username: () => firstUpper(getRandomElement(Faker.ADJECTIVES)) + firstUpper(getRandomElement(Faker.OBJECTS)),
  }

  private static PROVIDER = ['@gmail.com', '@yahoo.com', '@orange.fr']

  static internet = {
    email: () => {
      return Faker.name.fullname().toLocaleLowerCase().replace(' ', '.') + getRandomElement(Faker.PROVIDER)
    },
  }

  private static UUID_V4_TEMPLATE = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'

  static datatype = {
    uuidV4: (isCrypto = false): string => {
      return Faker.UUID_V4_TEMPLATE.replace(/[xy]/g, (c) => {
        const r = randomInt(0, 16, isCrypto)
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },
  }
}
