import { afterEach, describe, expect, test as it } from 'bun:test'
import { Rules } from '../../src'

afterEach(() => Rules.resetMessages())

describe('rule messages', () => {
  it('reads every default in English', () => {
    expect(Rules.isNumber('abc')).toBe('Must be a number')
    expect(Rules.min(3)(1)).toBe('At least 3.')
    expect(Rules.maxLength(2)('abc')).toBe('Max length is 2 characters')
  })

  it('takes translated messages at once, strings or functions of the rule parameters', () => {
    Rules.setMessages({ required: 'Requis', gte: ({ nb }) => `Au moins ${nb}`, maxLength: ({ length }) => `${length} caractères max` })

    expect(Rules.required('')).toBe('Requis')
    expect(Rules.nonEmptyString('')).toBe('Requis')
    expect(Rules.min(3)(1)).toBe('Au moins 3')
    expect(Rules.maxLength(2)('abc')).toBe('2 caractères max')
    expect(Rules.email('nope')).toBe('Invalid email')
  })

  it('puts the defaults back on reset', () => {
    Rules.setMessages({ required: 'Requis' })
    Rules.resetMessages()

    expect(Rules.required(null)).toBe('Required')
  })

  it('overrides one rule\'s message with withMessage, leaving passes alone', () => {
    const rule = Rules.withMessage(Rules.minLength(3), value => `"${value}" is too short`)

    expect(rule('ab')).toBe('"ab" is too short')
    expect(rule('abcd')).toBe(true)
    expect(Rules.withMessage(Rules.email, 'Adresse invalide')('nope')).toBe('Adresse invalide')
  })
})

describe('phone formats', () => {
  it('takes E164 numbers with separators', () => {
    expect(Rules.phone('+1 (415) 555-2671', 'E164')).toBe(true)
    expect(Rules.phone('0612345678', 'E164')).toBeString()
  })

  it('takes a pattern of its own', () => {
    expect(Rules.phone('12-34', /^\d{2}-\d{2}$/)).toBe(true)
    expect(Rules.phone('1234', /^\d{2}-\d{2}$/)).toBe('Invalid phone number')
  })
})

describe('isUrl protocols', () => {
  it('accepts the given protocols only', () => {
    expect(Rules.isUrl('ftp://example.com', { protocols: ['ftp:'] })).toBe(true)
    expect(Rules.isUrl('https://example.com', { protocols: ['ftp:'] })).toBe('URL must use ftp:')
    expect(Rules.isUrl('ftp://example.com')).toBe('Must be an HTTP or HTTPS URL')
  })

  it('still requires https with secured', () => {
    expect(Rules.isUrl('http://example.com', true)).toBe('URL must use HTTPS')
  })
})
