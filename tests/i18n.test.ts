import { describe, expect, test as it, spyOn } from 'bun:test'
import { declareI18n } from '../src/builders/i18n'
import { noop } from '../src/function'

describe('declareI18n', () => {
  const { t } = declareI18n({ en: { price: 'Cost: {amount}, again {amount}', odd: 'Hi {user.name} and {$x}' } } as const)

  it('inserts variable values literally', () => {
    for (const value of ['$&', '$1', '$$', '$\'', '$`'])
      expect(t('en', 'price', { amount: value })).toBe(`Cost: ${value}, again ${value}`)
  })

  it('matches variable names with regex characters literally', () => {
    expect(t('en', 'odd', { 'user.name': 'Ann', '$x': 'Bob' })).toBe('Hi Ann and Bob')
  })

  it('returns the key, not the group, when it names a group of translations', () => {
    const { t: tNested } = declareI18n({ en: { menu: { open: 'Open' } } } as const)
    const warn = spyOn(console, 'warn').mockImplementation(noop)

    expect(tNested('en', 'menu.open')).toBe('Open')
    expect((tNested as (locale: 'en', key: string) => string)('en', 'menu')).toBe('menu')
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
