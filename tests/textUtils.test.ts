import { escapeRegExp, getInitials, normalizeAccents, randomString, randomText, searchAll, searchOne, slugify } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('randomString function', () => {
  it('should generate a random string of specified length', () => {
    const length = 10
    expect((randomString(length)).length).toEqual(length)
  })

  it('should generate a random string from default charset', () => {
    const length = 10
    expect(randomString(length)).toMatch(new RegExp(`^[a-z0-9]{${length}}$`, 'i'))
  })

  it('should generate a random string from custom charset', () => {
    const length = 10
    const charset = 'abc123'
    expect(randomString(length, charset)).toMatch(new RegExp(`^[${charset}]{${length}}$`))
  })

  it('should handle empty charset', () => {
    const length = 10
    const charset = ''
    expect(randomString(length, charset)).toMatch(new RegExp(`^[a-z0-9]{${length}}$`, 'i'))
  })

  it('should handle length 0', () => {
    const length = 0
    const charset = 'abc123'
    expect(randomString(length, charset)).toEqual('')
  })

  it('should handle large length with default charset', () => {
    const length = 1000
    const result = randomString(length)
    expect(result.length).toEqual(length)
    expect(result).toMatch(new RegExp(`^[a-z0-9]{${length}}$`, 'i'))
  })
})

describe('normalizeAccents function', () => {
  it('handle lowercase accent', () => {
    expect(normalizeAccents('Café au Lait')).toBe('Cafe au Lait')
  })

  it('handle uppercase accent', () => {
    expect(normalizeAccents('Mötley CRÜE')).toBe('Motley CRUE')
  })

  it('handle empty string', () => {
    expect(normalizeAccents('')).toBe('')
  })

  it('handle no accent', () => {
    expect(normalizeAccents('Hello World')).toBe('Hello World')
  })
})

describe('escapeRegExp function', () => {
  it('special characters in a regular expression', () => {
    const input = 'Hello. World? [test]'
    const expectedOutput = 'Hello\\. World\\? \\[test\\]'
    const result = escapeRegExp(input)
    expect(result).toEqual(expectedOutput)
  })

  it('empty string', () => {
    const input = ''
    const expectedOutput = ''
    const result = escapeRegExp(input)
    expect(result).toEqual(expectedOutput)
  })

  it('all special characters', () => {
    const input = '.*+?^${}()|[]\\'
    const expectedOutput = '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'
    const result = escapeRegExp(input)
    expect(result).toEqual(expectedOutput)
  })

  it('strings with no special characters', () => {
    const input = 'Hello World'
    const expectedOutput = 'Hello World'
    const result = escapeRegExp(input)
    expect(result).toEqual(expectedOutput)
  })

  it('special characters in a regex pattern', () => {
    const input = '^Hello$'
    const expectedOutput = '\\^Hello\\$'
    const result = escapeRegExp(input)
    expect(result).toEqual(expectedOutput)
  })
})

describe('slugify function', () => {
  it('default options', () => {
    const result = slugify('Hello World')
    expect(result).toEqual('hello-world')
  })

  it('custom replacement', () => {
    const result = slugify('Hello World!', { replace: '_' })
    expect(result).toEqual('hello_world')
  })

  it('lower option is true', () => {
    const result = slugify('Hello World', { lower: true })
    expect(result).toEqual('hello-world')
  })

  it('lower option is false', () => {
    const result = slugify('Hello World', { lower: false })
    expect(result).toEqual('Hello-World')
  })

  it('trim option is true', () => {
    const result = slugify('   Hello World   ', { trim: true })
    expect(result).toEqual('hello-world')
  })

  it('trim option is false', () => {
    const result = slugify('   Hello World   ', { trim: false })
    expect(result).toEqual('-hello-world-')
  })

  it('deduplicate option is true', () => {
    const result = slugify('Hello  World!', { deduplicate: true })
    expect(result).toEqual('hello-world')
  })

  it('deduplicate option is false', () => {
    const result = slugify('Hello  World!', { deduplicate: false })
    expect(result).toEqual('hello--world')
  })

  it('empty string input', () => {
    const result = slugify('', { replace: '_' })
    expect(result).toEqual('')
  })

  it('special characters', () => {
    const result = slugify('Hello $ World!', { lower: false, replace: '_' })
    expect(result).toEqual('Hello_World')
  })

  it('accents and diacritics', () => {
    const result = slugify('Café au Lait', { lower: false, replace: '_' })
    expect(result).toEqual('Cafe_au_Lait')
  })
})

describe('getInitials function', () => {
  it('initials of the given words', () => {
    const result = getInitials('John', 'Doe')
    expect(result).toEqual('JD')
  })

  it('multiple words with spaces', () => {
    const result = getInitials('John Doe Smith')
    expect(result).toEqual('JDS')
  })

  it('one-word input', () => {
    const result = getInitials('Alice')
    expect(result).toEqual('A')
  })

  it('empty input', () => {
    const result = getInitials()
    expect(result).toEqual('')
  })

  it('longer words and trim to 3 characters', () => {
    const result = getInitials('International Business Machines Etc')
    expect(result).toEqual('IBM')
  })

  it('non-alphabetic characters', () => {
    const result = getInitials('123', 'ABC', '$%^')
    expect(result).toEqual('1A$')
  })
})

describe('randomText function', () => {
  it('should generate a random paragraph of specified length', () => {
    const length = 5
    const result = randomText({ length, type: 'paragraph' })
    expect(result.split('\n').length).toEqual(length)
  })

  it('should generate a random sentence of specified length', () => {
    const length = 5
    const result = randomText({ length, type: 'sentence' })
    expect(result.split('.').length - 1).toEqual(length)
  })

  it('should generate a random word of specified length', () => {
    const length = 5
    const result = randomText({ length, type: 'word' })
    expect(result.split(' ').length).toEqual(length)
  })

  it('should handle empty options', () => {
    const result = randomText()
    expect(result.split('\n').length).toEqual(5)
  })
})

describe('searchOne function', () => {
  it('should return true if one of the values contains the query', () => {
    const result = searchOne('hello', 'hello world', 'goodbye world')
    expect(result).toEqual(true)
  })

  it('should return false if none of the values contains the query', () => {
    const result = searchOne('hello', 'goodbye world', 'see you later')
    expect(result).toEqual(false)
  })

  it('should handle accents in the query and values', () => {
    const result = searchOne('café', 'Café au lait', 'Tea')
    expect(result).toEqual(true)
  })
})

describe('searchAll function', () => {
  it('should return true if all of the values contains the query', () => {
    const result = searchAll('world', 'hello world', 'goodbye world')
    expect(result).toEqual(true)
  })

  it('should return false if one of the values does not contain the query', () => {
    const result = searchAll('world', 'hello world', 'see you later')
    expect(result).toEqual(false)
  })

  it('should handle accents in the query and values', () => {
    const result = searchAll('café', 'Café au lait', 'Café noir')
    expect(result).toEqual(true)
  })
})
