import { describe, expect, test as it } from 'bun:test'
import { Faker } from '../src/fakerUtils'

describe('faker.paragraph function', () => {
  const notEmpty = (value: any) => Boolean(value)

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

  it('text: should generate random words', () => {
    const result = Faker.lorem({ type: 'word' })
    expect(result.split(' ').filter(notEmpty).length).toEqual(5)
  })
})

describe('uuidV4 function', () => {
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
