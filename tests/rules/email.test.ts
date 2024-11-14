import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('email rule', () => {
  const rules = getRules()

  it('email', () => {
    const email = 'test@test.com'
    expect(rules.email(email)).toBe(true)
  })

  it('should invalidate incorrect email', () => {
    const email = 'invalid-email'
    expect(rules.email(email)).toBeString()
  })

  it('should invalidate email without domain', () => {
    const email = 'test@.com'
    expect(rules.email(email)).toBeString()
  })

  it('should invalidate email without username', () => {
    const email = '@test.com'
    expect(rules.email(email)).toBeString()
  })

  it('should invalidate email with spaces', () => {
    const email = 'test @test.com'
    expect(rules.email(email)).toBeString()
  })
})
