import { describe, expect, test as it } from 'bun:test'
import { cryptoRandom } from '../src'
import { createFaker, Faker } from '../src/tools'

const UUID_V4_REGEX = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/
const MONTH_REGEX = /^(0[1-9]|1[0-2])$/

describe('faker.paragraph function', () => {
  const notEmpty = (value: unknown) => Boolean(value)

  it('should generate a random word of specified length', () => {
    const length = 5
    const result = Faker.lorem.word(length)

    expect(result.split(' ').length).toEqual(length)
  })

  it('should generate a random sentence of specified length', () => {
    const length = 5
    const result = Faker.lorem.sentence(length)

    expect(result.split('.').filter(notEmpty).length).toEqual(length)
  })

  it('should generate a random paragraph of specified length', () => {
    const length = 5
    const result = Faker.lorem.paragraph(length)

    expect(result.split('\n').filter(notEmpty).length).toEqual(length)
  })

  it('word: should handle empty options', () => {
    const result = Faker.lorem.word()

    expect(result.split(' ').filter(notEmpty).length).toEqual(1)
  })

  it('sentence: should handle empty options', () => {
    const result = Faker.lorem.sentence()

    expect(result.split('.').filter(notEmpty).length).toEqual(1)
  })

  it('paragraph: should handle empty options', () => {
    const result = Faker.lorem.paragraph()

    expect(result.split('\n').filter(notEmpty).length).toEqual(1)
  })
})

describe('faker.uuidV4 function', () => {
  it('should generate a valid UUID v4 string', () => {
    const uuid = Faker.datatype.uuidV4()

    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('should generate unique UUIDs', () => {
    const uuid1 = Faker.datatype.uuidV4()
    const uuid2 = Faker.datatype.uuidV4()

    expect(uuid1).not.toEqual(uuid2)
  })
})

describe('createFaker', () => {
  it('repeats its output for the same seed', () => {
    const run = (seed: string) => {
      const faker = createFaker({ seed })

      return [faker.name.fullname(), faker.internet.email(), faker.date.date(), faker.lorem.sentence(2), faker.datatype.uuidV4()]
    }

    expect(run('fixtures')).toEqual(run('fixtures'))
    expect(run('fixtures')).not.toEqual(run('other'))
  })

  it('takes its own random source, names and providers', () => {
    const faker = createFaker({ random: () => 0, firstNames: ['Jean Paul'], lastNames: ['Dupont'], emailProviders: ['@exemple.fr'] })

    expect(faker.name.fullname()).toBe('Jean Paul Dupont')
    expect(faker.internet.email()).toBe('jean.paul.dupont@exemple.fr')
  })

  it('draws from cryptoRandom', () => {
    const faker = createFaker({ random: cryptoRandom })

    expect(faker.datatype.uuidV4()).toMatch(UUID_V4_REGEX)
    expect(faker.date.month()).toMatch(MONTH_REGEX)
  })

  it('only makes real days', () => {
    const faker = createFaker({ seed: 1 })

    for (let i = 0; i < 500; i++) {
      const label = faker.date.date({ startYear: 2023, endYear: 2024 })
      const [year, month, day] = label.split('-').map(Number)
      const parsed = new Date(year!, month! - 1, day!)

      expect(parsed.getMonth()).toBe(month! - 1)
    }
  })
})
