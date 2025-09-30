import { describe, expect, test as it } from 'bun:test'
import { Rules } from '~'

describe('email rule', () => {
  it('email', () => {
    const email = 'test@test.com'

    expect(Rules.email(email)).toBe(true)
  })

  it('should invalidate incorrect email', () => {
    const email = 'invalid-email'

    expect(Rules.email(email)).toBeString()
  })

  it('should invalidate email without domain', () => {
    const email = 'test@.com'

    expect(Rules.email(email)).toBeString()
  })

  it('should invalidate email without username', () => {
    const email = '@test.com'

    expect(Rules.email(email)).toBeString()
  })

  it('should invalidate email with spaces', () => {
    const email = 'test @test.com'

    expect(Rules.email(email)).toBeString()
  })
})
