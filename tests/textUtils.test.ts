import { escapeCSV, escapeRegExp, escapeXml, getInitials, getUuidFromIri, matchingSubstring, matchLength, normalizeAccents, plural, progressBar, randomString, randomText, removeComments, searchAll, searchOne, slugify, uuidV4 } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('randomString function', () => {
  it('should generate a random string of specified length', () => {
    const length = 10
    expect(randomString(length)).toHaveLength(length)
  })

  it('should generate a crypto random string of specified length', () => {
    const length = 10
    expect(randomString(length, undefined, true)).toHaveLength(length)
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

describe('removeComments function', () => {
  it('should remove single-line comments', () => {
    const result = removeComments('const x = 10; // this is a comment')
    expect(result).toEqual('const x = 10; ')
  })

  it('should remove multi-line comments', () => {
    const result = removeComments('/* this is a \n multiline comment */ const y = 20;')
    expect(result).toEqual(' const y = 20;')
  })

  it('should remove multiple comments', () => {
    const result = removeComments('const x = 10; // comment\nconst y = 20; /* another comment */')
    expect(result).toEqual('const x = 10; \nconst y = 20; ')
  })

  it('should handle no comments gracefully', () => {
    const result = removeComments('const x = 10; const y = 20;')
    expect(result).toEqual('const x = 10; const y = 20;')
  })
})

describe('escapeXml function', () => {
  it('should escape XML special characters', () => {
    const result = escapeXml('<tag> "text" & \'data\' </tag>')
    expect(result).toEqual('&lt;tag&gt; &quot;text&quot; &amp; &apos;data&apos; &lt;/tag&gt;')
  })

  it('should handle no special characters gracefully', () => {
    const result = escapeXml('plain text')
    expect(result).toEqual('plain text')
  })
})

describe('escapeCSV function', () => {
  it('should escape double quotes in CSV', () => {
    const result = escapeCSV('value "with" quotes')
    expect(result).toEqual('"value ""with"" quotes"')
  })

  it('should add quotes around values with commas', () => {
    const result = escapeCSV('value, with, commas')
    expect(result).toEqual('"value, with, commas"')
  })

  it('should add quotes around values with newlines', () => {
    const result = escapeCSV('multi\nline')
    expect(result).toEqual('"multi\nline"')
  })

  it('should handle numeric input', () => {
    const result = escapeCSV(12345)
    expect(result).toEqual('12345')
  })
})

describe('matchLength function', () => {
  it('should return length of matching prefix', () => {
    const result = matchLength('hello', 'helicopter')
    expect(result).toEqual(3)
  })

  it('should return zero for non-matching strings', () => {
    const result = matchLength('hello', 'world')
    expect(result).toEqual(0)
  })

  it('should handle empty strings', () => {
    const result = matchLength('', 'anything')
    expect(result).toEqual(0)
  })
})

describe('matchingSubstring function', () => {
  it('should return matching substring', () => {
    const result = matchingSubstring('hello', 'helicopter')
    expect(result).toEqual('hel')
  })

  it('should return empty string for non-matching strings', () => {
    const result = matchingSubstring('hello', 'world')
    expect(result).toEqual('')
  })
})

describe('getUuidFromIri function', () => {
  it('should extract UUID from IRI', () => {
    const result = getUuidFromIri('https://example.com/resource/123e4567-e89b-12d3-a456-426614174000')
    expect(result).toEqual('123e4567-e89b-12d3-a456-426614174000')
  })

  it('should return null if no UUID found', () => {
    const result = getUuidFromIri('https://example.com/resource/')
    expect(result).toBeNull()
  })
})

describe('uuidV4 function', () => {
  it('should generate a valid UUID v4 string', () => {
    const uuid = uuidV4()
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('should generate unique UUIDs', () => {
    const uuid1 = uuidV4()
    const uuid2 = uuidV4()
    expect(uuid1).not.toEqual(uuid2)
  })
})

describe('progressBar function', () => {
  it('should return a full bar if value is equal to max and min equals max', () => {
    const result = progressBar(100, 100, 100)
    expect(result).toEqual('[========================================]')
  })

  it('should return an empty bar if value is less than max and min equals max', () => {
    const result = progressBar(50, 100, 100)
    expect(result).toEqual('[                                        ]')
  })

  it('should return a full bar if value is max', () => {
    const result = progressBar(100, 0, 100)
    expect(result).toEqual('[========================================]')
  })

  it('should return an empty bar if value is min', () => {
    const result = progressBar(0, 0, 100)
    expect(result).toEqual('[                                        ]')
  })

  it('should return a partial bar for intermediate values', () => {
    const result = progressBar(50, 0, 100)
    expect(result).toEqual('[====================                    ]')
  })

  it('should handle tip character correctly', () => {
    const result = progressBar(50, 0, 100, { tipChar: '>' })
    expect(result).toEqual('[===================>                    ]')
  })
})

describe('plural function', () => {
  it('should handle words ending in "y"', () => {
    const result = plural('baby')
    expect(result).toEqual('babies')
  })

  it('should handle words ending in "s", "x", "z", "ch", "sh"', () => {
    const result = plural('box')
    expect(result).toEqual('boxes')
  })

  it('should handle words ending in "f"', () => {
    const result = plural('leaf')
    expect(result).toEqual('leaves')
  })

  it('should handle words ending in "fe"', () => {
    const result = plural('knife')
    expect(result).toEqual('knives')
  })

  it('should handle regular plurals', () => {
    const result = plural('cat')
    expect(result).toEqual('cats')
  })
})
