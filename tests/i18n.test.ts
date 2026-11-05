import { describe, expect, test as it } from 'bun:test'
import { declareI18n } from '../src/builders/i18n'

describe('declareI18n', () => {
  const { t } = declareI18n({ en: { price: 'Cost: {amount}, again {amount}', odd: 'Hi {user.name} and {$x}' } } as const)

  it('inserts variable values literally', () => {
    for (const value of ['$&', '$1', '$$', '$\'', '$`'])
      expect(t('en', 'price', { amount: value })).toBe(`Cost: ${value}, again ${value}`)
  })

  it('matches variable names with regex characters literally', () => {
    expect(t('en', 'odd', { 'user.name': 'Ann', '$x': 'Bob' })).toBe('Hi Ann and Bob')
  })
})
