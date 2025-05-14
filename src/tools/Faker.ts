import { getRandomElement } from '~/array'
import { getDaysInMonth } from '~/date'
import { randomInt } from '~/number'
import { firstUpper } from '~/text'

const LOREM_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'proin', 'ultricies', 'sed', 'dui', 'scelerisque', 'donec', 'pellentesque', 'diam', 'vel', 'ligula', 'efficitur']

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor']

const ADJECTIVES = ['quick', 'bright', 'massive', 'ancient', 'fragile', 'smooth', 'silent', 'fierce', 'colorful', 'mysterious', 'epic', 'stealthy', 'legendary', 'agile', 'immersive']
const OBJECTS = ['table', 'mountain', 'lamp', 'book', 'window', 'river', 'cloud', 'carpet', 'bottle', 'clock', 'controller', 'sword', 'avatar', 'quest', 'dungeon', 'rocket']

const EMAIL_PROVIDER = ['@gmail.com', '@yahoo.com', '@orange.fr']
const UUID_V4_TEMPLATE = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'

export const Faker = {
  lorem: {
    paragraph: (length = 1, isCrypto = false, dictionary = LOREM_WORDS): string =>
      Array.from({ length: Math.max(1, length) }, () => {
        const count = randomInt(3, 7, isCrypto)
        return Faker.lorem.sentence(count, isCrypto, dictionary)
      }).join('\n'),
    sentence: (length = 1, isCrypto = false, dictionary = LOREM_WORDS): string =>
      Array.from({ length: Math.max(1, length) }, () => {
        const count = randomInt(5, 15, isCrypto)
        const sentence = Faker.lorem.word(count, isCrypto, dictionary).replace(/ /g, () => Math.random() < 0.1 ? ', ' : ' ')

        return `${firstUpper(sentence)}.`
      }).join(' '),
    word: (length = 1, isCrypto = false, dictionary = LOREM_WORDS): string =>
      Array.from({ length: Math.max(1, length) }, () => getRandomElement(dictionary, isCrypto)).join(' '),
  },

  date: {
    date: ({
      endYear = new Date().getFullYear() + 4,
      startYear = new Date().getFullYear() - 4,
    }: { endYear?: number, startYear?: number } = {}): string => {
      const year = Number(Faker.date.year({ endYear, startYear }))
      const month = Number(Faker.date.month())
      const daysInMonth = getDaysInMonth(year, month)

      const day = Math.floor(Math.random() * daysInMonth) + 1
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    },
    month: (): string => {
      const month = Math.floor(Math.random() * 12) + 1
      return month.toString().padStart(2, '0')
    },
    year: ({ endYear = new Date().getFullYear() + 4, startYear = new Date().getFullYear() - 4 }: { endYear?: number, startYear?: number } = {}): string => {
      const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
      return year.toString()
    },
  },

  name: {
    firstName: () => getRandomElement(FIRST_NAMES),
    fullname: () => `${Faker.name.firstName()} ${Faker.name.lastName()}`,
    lastName: () => getRandomElement(LAST_NAMES),
    username: () => firstUpper(getRandomElement(ADJECTIVES)) + firstUpper(getRandomElement(OBJECTS)),
  },

  internet: {
    email: () => {
      return Faker.name.fullname().toLocaleLowerCase().replace(' ', '.') + getRandomElement(EMAIL_PROVIDER)
    },
  },

  datatype: {
    uuidV4: (isCrypto = false): string => {
      return UUID_V4_TEMPLATE.replace(/[xy]/g, (c) => {
        const r = randomInt(0, 16, isCrypto)
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },
  },
}
