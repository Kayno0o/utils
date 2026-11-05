import { describe, expect, test as it } from 'bun:test'
import { declareI18n } from '../src/builders/i18n'

describe('declareI18n', () => {
  const { t } = declareI18n({ en: { price: 'Cost: {amount}, again {amount}' } } as const)

  it('inserts variable values literally', () => {
    for (const value of ['$&', '$1', '$$', '$\'', '$`'])
      expect(t('en', 'price', { amount: value })).toBe(`Cost: ${value}, again ${value}`)
  })
})
