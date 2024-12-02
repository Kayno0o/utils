import { describe, expect, test as it } from 'bun:test'
import { Faker } from '../src/fakerUtils'

describe('faker.paragraph function', () => {
  const notEmpty = (value: any) => !!value
  const faker = new Faker()

  it('should generate a random word of specified length', () => {
    const length = 5
    const result = faker.lorem.word(length)
    expect(result.split(' ').length).toEqual(length)
  })

  it('should generate a random sentence of specified length', () => {
    const length = 5
    const result = faker.lorem.sentence(length)
    expect(result.split('.').filter(notEmpty).length).toEqual(length)
  })

  it('should generate a random paragraph of specified length', () => {
    const length = 5
    const result = faker.lorem.paragraph(length)
    expect(result.split('\n').filter(notEmpty).length).toEqual(length)
  })

  it('word: should handle empty options', () => {
    const result = faker.lorem.word()
    expect(result.split(' ').filter(notEmpty).length).toEqual(1)
  })

  it('sentence: should handle empty options', () => {
    const result = faker.lorem.sentence()
    expect(result.split('.').filter(notEmpty).length).toEqual(1)
  })

  it('paragraph: should handle empty options', () => {
    const result = faker.lorem.paragraph()
    expect(result.split('\n').filter(notEmpty).length).toEqual(1)
  })

  it('text: should generate random words', () => {
    const result = faker.lorem({ type: 'word' })
    expect(result.split(' ').filter(notEmpty).length).toEqual(1)
  })
})
