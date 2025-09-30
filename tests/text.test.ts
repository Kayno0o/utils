import { describe, expect, test as it } from 'bun:test'
import { escapeCSV, escapeRegExp, escapeXml, expandUUID, getInitials, getUuidFromIri, matchingSubstring, matchLength, minifyUUID, normalizeAccents, plural, progressBar, randomString, removeComments, searchAll, searchOne, slugify, toCamel, toCase, toConstant, toKebab, toPascal, toSnake, toTitle } from '~'

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

describe('minifyUUID & expandUUID functions', () => {
  const uuid = 'ab8e71cc-6c08-4df6-8996-c1885fa1a9f8'
  const minified = 'q45xzGwITfaJlsGIX6Gp-A'

  it('should correctly minify a UUID', () => {
    const result = minifyUUID(uuid)

    expect(result).toEqual(minified)
  })

  it('should correctly expand a minified UUID', () => {
    const result = expandUUID(minified)

    expect(result).toEqual(uuid)
  })

  it('should return the same UUID after minifying and re-expanding', () => {
    const generatedUUID = 'de305d54-75b4-431b-adb2-eb6b9e546014'
    const result = expandUUID(minifyUUID(generatedUUID))

    expect(result).toEqual(generatedUUID)
  })

  it('should throw an error for invalid UUIDs', () => {
    expect(() => minifyUUID('invalid-uuid')).toThrowError('Invalid UUID format')
    expect(() => expandUUID('invalid-minified')).toThrowError('Invalid minified format')
  })

  it('should handle edge cases like uppercase UUIDs', () => {
    const uppercaseUUID = uuid.toUpperCase()
    const result = minifyUUID(uppercaseUUID)

    expect(result).toEqual(minified)
  })
})

describe('toCase function', () => {
  it('converts camelCase', () => {
    expect(toCase('someVariableName')).toEqual(['some', 'variable', 'name'])
  })

  it('converts PascalCase', () => {
    expect(toCase('SomeVariableName')).toEqual(['some', 'variable', 'name'])
  })

  it('converts kebab-case', () => {
    expect(toCase('kebab-case-input')).toEqual(['kebab', 'case', 'input'])
  })

  it('converts snake_case', () => {
    expect(toCase('snake_case_input')).toEqual(['snake', 'case', 'input'])
  })

  it('handles space-separated input', () => {
    expect(toCase('already spaced out')).toEqual(['already', 'spaced', 'out'])
  })

  it('handles multiple separators and extra whitespace', () => {
    expect(toCase(' messy___input--With   Stuff')).toEqual(['messy', 'input', 'with', 'stuff'])
  })

  it('returns lowercase words from array input', () => {
    expect(toCase(['One', 'TWO', 'Three'])).toEqual(['one', 'two', 'three'])
  })

  it('returns empty array on empty string', () => {
    expect(toCase('')).toEqual([])
  })

  it('returns empty array on string with no words', () => {
    expect(toCase('---__  ')).toEqual([])
  })
})

describe('Case conversion functions', () => {
  const cases: [string, string][] = [
    ['hello world example', 'hello-world-example'],
    ['HelloWorldExample', 'hello-world-example'],
    ['snake_case_example', 'snake-case-example'],
    ['kebab-case-example', 'kebab-case-example'],
    [' already_mixedCase-Example__ ', 'already-mixed-case-example'],
  ]

  it.each(cases)('toKebabCase - "%s"', (input, expected) => {
    expect(toKebab(input)).toBe(expected)
  })

  it.each(cases)('toSnakeCase - "%s"', (input, expected) => {
    expect(toSnake(input)).toBe(expected.replace(/-/g, '_'))
  })

  it.each(cases)('toCamelCase - "%s"', (input, expected) => {
    const parts = expected.split('-')
    const expectedCamel = parts[0] + parts.slice(1).map(w => w[0].toUpperCase() + w.slice(1)).join('')

    expect(toCamel(input)).toBe(expectedCamel)
  })

  it.each(cases)('toPascalCase - "%s"', (input, expected) => {
    const expectedPascal = expected
      .split('-')
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join('')

    expect(toPascal(input)).toBe(expectedPascal)
  })

  it.each(cases)('toConstantCase - "%s"', (input, expected) => {
    expect(toConstant(input)).toBe(expected.replace(/-/g, '_').toUpperCase())
  })

  it.each(cases)('toTitleCase - "%s"', (input, expected) => {
    const expectedTitle = expected
      .split('-')
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(' ')

    expect(toTitle(input)).toBe(expectedTitle)
  })

  it('handles string[] input consistently across converters', () => {
    const arrayInput = ['one', 'TWO', 'Three']

    expect(toKebab(arrayInput)).toBe('one-two-three')
    expect(toSnake(arrayInput)).toBe('one_two_three')
    expect(toCamel(arrayInput)).toBe('oneTwoThree')
    expect(toPascal(arrayInput)).toBe('OneTwoThree')
    expect(toConstant(arrayInput)).toBe('ONE_TWO_THREE')
    expect(toTitle(arrayInput)).toBe('One Two Three')
  })
})

const inputVariants = {
  kebab: 'hello-world-example',
  snake: 'hello_world_example',
  camel: 'helloWorldExample',
  pascal: 'HelloWorldExample',
  constant: 'HELLO_WORLD_EXAMPLE',
  title: 'Hello World Example',
}

describe('Case conversion between formats', () => {
  it('converts from kebab-case to all formats', () => {
    const input = inputVariants.kebab

    expect(toSnake(input)).toBe('hello_world_example')
    expect(toCamel(input)).toBe('helloWorldExample')
    expect(toPascal(input)).toBe('HelloWorldExample')
    expect(toConstant(input)).toBe('HELLO_WORLD_EXAMPLE')
    expect(toTitle(input)).toBe('Hello World Example')
  })

  it('converts from snake_case to all formats', () => {
    const input = inputVariants.snake

    expect(toKebab(input)).toBe('hello-world-example')
    expect(toCamel(input)).toBe('helloWorldExample')
    expect(toPascal(input)).toBe('HelloWorldExample')
    expect(toConstant(input)).toBe('HELLO_WORLD_EXAMPLE')
    expect(toTitle(input)).toBe('Hello World Example')
  })

  it('converts from camelCase to all formats', () => {
    const input = inputVariants.camel

    expect(toKebab(input)).toBe('hello-world-example')
    expect(toSnake(input)).toBe('hello_world_example')
    expect(toPascal(input)).toBe('HelloWorldExample')
    expect(toConstant(input)).toBe('HELLO_WORLD_EXAMPLE')
    expect(toTitle(input)).toBe('Hello World Example')
  })

  it('converts from PascalCase to all formats', () => {
    const input = inputVariants.pascal

    expect(toKebab(input)).toBe('hello-world-example')
    expect(toSnake(input)).toBe('hello_world_example')
    expect(toCamel(input)).toBe('helloWorldExample')
    expect(toConstant(input)).toBe('HELLO_WORLD_EXAMPLE')
    expect(toTitle(input)).toBe('Hello World Example')
  })

  it('converts from CONSTANT_CASE to all formats', () => {
    const input = inputVariants.constant

    expect(toKebab(input)).toBe('hello-world-example')
    expect(toSnake(input)).toBe('hello_world_example')
    expect(toCamel(input)).toBe('helloWorldExample')
    expect(toPascal(input)).toBe('HelloWorldExample')
    expect(toTitle(input)).toBe('Hello World Example')
  })

  it('converts from Title Case to all formats', () => {
    const input = inputVariants.title

    expect(toKebab(input)).toBe('hello-world-example')
    expect(toSnake(input)).toBe('hello_world_example')
    expect(toCamel(input)).toBe('helloWorldExample')
    expect(toPascal(input)).toBe('HelloWorldExample')
    expect(toConstant(input)).toBe('HELLO_WORLD_EXAMPLE')
  })
})
