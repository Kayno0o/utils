import { describe, expect, test as it } from 'bun:test'
import { faker } from '../src/fakerUtils'

describe('faker.paragraph function', () => {
  const f = faker()

  const notEmpty = (value: any) => !!value

  it('should generate a random word of specified length', () => {
    const length = 5
    const result = f.word(length)
    expect(result.split(' ').length).toEqual(length)
  })

  it('should generate a random sentence of specified length', () => {
    const length = 5
    const result = f.sentence(length)
    expect(result.split('.').filter(notEmpty).length).toEqual(length)
  })

  it('should generate a random paragraph of specified length', () => {
    const length = 5
    const result = f.paragraph(length)
    expect(result.split('\n').filter(notEmpty).length).toEqual(length)
  })

  it('word: should handle empty options', () => {
    const result = f.word()
    expect(result.split(' ').filter(notEmpty).length).toEqual(1)
  })

  it('sentence: should handle empty options', () => {
    const result = f.sentence()
    expect(result.split('.').filter(notEmpty).length).toEqual(1)
  })

  it('paragraph: should handle empty options', () => {
    const result = f.paragraph()
    expect(result.split('\n').filter(notEmpty).length).toEqual(1)
  })
})
