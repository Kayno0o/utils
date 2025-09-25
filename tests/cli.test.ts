import { describe, expect, it } from 'bun:test'
import { parseArgs } from '~'

describe('parseArgs function', () => {
  it('should parse boolean options correctly', () => {
    const result = parseArgs({
      args: ['--verbose', '--debug=false'],
      options: {
        verbose: { type: 'boolean' },
        debug: { type: 'boolean' },
      },
    })
    expect(result.verbose).toBe(true)
    expect(result.debug).toBe(false)
  })

  it('should parse string options correctly', () => {
    const result = parseArgs({
      args: ['--name=test', '--message', 'hello world'],
      options: {
        name: { type: 'string' },
        message: { type: 'string' },
      },
    })
    expect(result.name).toBe('test')
    expect(result.message).toBe('hello world')
  })

  it('should parse number options correctly', () => {
    const result = parseArgs({
      args: ['--count=42', '--weight', '3.14'],
      options: {
        count: { type: 'int' },
        weight: { type: 'float' },
      },
    })
    expect(result.count).toBe(42)
    expect(result.weight).toBe(3.14)
  })

  it('should handle short option aliases', () => {
    const result = parseArgs({
      args: ['-v', '-c', '10'],
      options: {
        verbose: { type: 'boolean', short: 'v' },
        count: { type: 'int', short: 'c' },
      },
    })
    expect(result.verbose).toBe(true)
    expect(result.count).toBe(10)
  })

  it('should handle option aliases', () => {
    const result = parseArgs({
      args: ['--typescript', '--output-dir=dist'],
      options: {
        ts: { type: 'boolean', alias: 'typescript' },
        outputDir: { type: 'string', alias: 'output-dir' },
      },
    })
    expect(result.ts).toBe(true)
    expect(result.outputDir).toBe('dist')
  })

  it('should handle default values in option definitions', () => {
    const result = parseArgs({
      args: [],
      options: {
        port: { type: 'int', default: 3000 },
        host: { type: 'string', default: 'localhost' },
      },
    })
    expect(result.port).toBe(3000)
    expect(result.host).toBe('localhost')
  })

  it('should throw error for missing required options', () => {
    expect(() => parseArgs({
      args: [],
      options: {
        required: { type: 'string', required: true },
      },
    })).toThrow('Some required options were not found: required')
  })

  it('should handle custom format functions', () => {
    const result = parseArgs({
      args: ['--items=a,b,c'],
      options: {
        items: {
          type: 'string',
          format: (value: string) => value.split(','),
        },
      },
    })
    expect(result.items).toEqual(['a', 'b', 'c'])
  })

  it('should validate options correctly', () => {
    const result = parseArgs({
      args: ['--age=25'],
      options: {
        age: {
          type: 'int',
          validate: (value: number) => value >= 18 ? true : 'Must be at least 18',
        },
      },
    })
    expect(result.age).toBe(25)
  })

  it('should handle boolean options with various true values', () => {
    const configs = [
      { args: ['--flag=true'], expected: true },
      { args: ['--flag=1'], expected: true },
      { args: ['--flag'], expected: true },
    ]

    for (const { args, expected } of configs) {
      const result = parseArgs({
        args,
        options: {
          flag: { type: 'boolean' },
        },
      })
      expect(result.flag).toBe(expected)
    }
  })

  it('should handle boolean options with false values', () => {
    const configs = [
      { args: ['--flag=false'], expected: false },
      { args: ['--flag=0'], expected: false },
    ]

    for (const { args, expected } of configs) {
      const result = parseArgs({
        args,
        options: {
          flag: { type: 'boolean' },
        },
      })
      expect(result.flag).toBe(expected)
    }
  })

  it('should ignore unrecognized options', () => {
    const result = parseArgs({
      args: ['--known=value', '--unknown=ignored'],
      options: {
        known: { type: 'string' },
      },
    })
    expect(result.known).toBe('value')
    expect('unknown' in result).toBe(false)
  })

  it('should handle multiple aliases for the same option', () => {
    const result = parseArgs({
      args: ['--typescript'],
      options: {
        ts: { type: 'boolean', alias: ['typescript', 'lang-ts'] },
      },
    })
    expect(result.ts).toBe(true)
  })

  it('should handle format-only options without type', () => {
    const result = parseArgs({
      args: ['--items=a,b,c'],
      options: {
        items: {
          format: (value: string) => value.split(','),
        },
      },
    })
    expect(result.items).toEqual(['a', 'b', 'c'])
  })

  it('should handle format-only options with complex parsing', () => {
    const result = parseArgs({
      args: ['--config={"key":"value"}'],
      options: {
        config: {
          format: (value: string) => JSON.parse(value) as { key: string },
        },
      },
    })
    expect(result.config).toEqual({ key: 'value' })
  })

  it('should handle boolean default values correctly', () => {
    const result = parseArgs({
      args: [],
      options: {
        enabled: { type: 'boolean', default: true },
        disabled: { type: 'boolean', default: false },
      },
    })
    expect(result.enabled).toBe(true)
    expect(result.disabled).toBe(false)
  })

  it('should throw error for invalid boolean values', () => {
    expect(() => parseArgs({
      args: ['--flag=invalid'],
      options: {
        flag: { type: 'boolean' },
      },
    })).toThrow('Invalid value: invalid\nExpected value of type: boolean')
  })

  it('should throw error for invalid number values', () => {
    expect(() => parseArgs({
      args: ['--count=abc'],
      options: {
        count: { type: 'int' },
      },
    })).toThrow('Invalid value: abc\nExpected value of type: int')
  })

  it('should throw error for invalid float values', () => {
    expect(() => parseArgs({
      args: ['--weight=not-a-number'],
      options: {
        weight: { type: 'float' },
      },
    })).toThrow('Invalid value: not-a-number\nExpected value of type: float')
  })

  it('should handle date type options', () => {
    const result = parseArgs({
      args: ['--date=2023-12-25'],
      options: {
        date: { type: 'date' },
      },
    })
    expect(result.date).toBeInstanceOf(Date)
    expect(result.date).toEqual(new Date('2023-12-25'))
  })

  it('should throw error for invalid date values', () => {
    expect(() => parseArgs({
      args: ['--date=invalid-date'],
      options: {
        date: { type: 'date' },
      },
    })).toThrow('Invalid value: invalid-date\nExpected value of type: date')
  })

  it('should handle number type (generic number parsing)', () => {
    const result = parseArgs({
      args: ['--value=123.45'],
      options: {
        value: { type: 'number' },
      },
    })
    expect(result.value).toBe(123.45)
  })

  it('should handle path type options for existing files', () => {
    const result = parseArgs({
      args: ['--file=package.json'],
      options: {
        file: { type: 'path' },
      },
    })
    expect(result.file).toBe('package.json')
  })

  it('should throw error for non-existent path', () => {
    expect(() => parseArgs({
      args: ['--file=non-existent-file.txt'],
      options: {
        file: { type: 'path' },
      },
    })).toThrow('Invalid value: non-existent-file.txt\nExpected value of type: path')
  })

  it('should handle mixed default types correctly', () => {
    const result = parseArgs({
      args: [],
      options: {
        stringDefault: { type: 'string', default: 'hello' },
        numberDefault: { type: 'int', default: 42 },
        booleanDefault: { type: 'boolean', default: true },
        formatDefault: {
          format: (value: string) => value.split(','),
          default: ['a', 'b'],
        },
      },
    })
    expect(result.stringDefault).toBe('hello')
    expect(result.numberDefault).toBe(42)
    expect(result.booleanDefault).toBe(true)
    expect(result.formatDefault).toEqual(['a', 'b'])
  })

  it('should throw error for option without type or format', () => {
    expect(() => parseArgs({
      args: ['--invalid=value'],
      options: {
        invalid: {} as any,
      },
    })).toThrow('Option invalid must have either a \'type\' or \'format\' function')
  })
})
