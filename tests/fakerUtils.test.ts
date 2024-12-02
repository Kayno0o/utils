import { describe, expect, test as it } from 'bun:test'
import { Faker } from '../src/fakerUtils'

describe('faker.paragraph function', () => {
  const notEmpty = (value: any) => !!value
  const faker = new Faker()

  it('should generate a random word of specified length', () => {
    const length = 5
    const result = faker.text.word(length)
    expect(result.split(' ').length).toEqual(length)
  })

  it('should generate a random sentence of specified length', () => {
    const length = 5
    const result = faker.text.sentence(length)
    expect(result.split('.').filter(notEmpty).length).toEqual(length)
  })

  it('should generate a random paragraph of specified length', () => {
    const length = 5
    const result = faker.text.paragraph(length)
    expect(result.split('\n').filter(notEmpty).length).toEqual(length)
  })

  it('word: should handle empty options', () => {
    const result = faker.text.word()
    expect(result.split(' ').filter(notEmpty).length).toEqual(1)
  })

  it('sentence: should handle empty options', () => {
    const result = faker.text.sentence()
    expect(result.split('.').filter(notEmpty).length).toEqual(1)
  })

  it('paragraph: should handle empty options', () => {
    const result = faker.text.paragraph()
    expect(result.split('\n').filter(notEmpty).length).toEqual(1)
  })

  it('text: should generate random words', () => {
    const result = faker.text({ type: 'word' })
    expect(result.split(' ').filter(notEmpty).length).toEqual(1)
  })
})
