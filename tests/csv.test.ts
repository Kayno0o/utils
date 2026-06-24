import { describe, expect, test as it } from 'bun:test'
import { csvParse, csvStringify } from '../src'

describe('csvParse', () => {
  it('parses basic CSV', () => {
    expect(csvParse('name,age\nAlice,30\nBob,25')).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ])
  })

  it('supports custom separator', () => {
    expect(csvParse('a;b\n1;2', { separator: ';' })).toEqual([{ a: '1', b: '2' }])
  })

  it('handles quoted fields', () => {
    expect(csvParse('name,note\nAlice,"hello, world"')).toEqual([{ name: 'Alice', note: 'hello, world' }])
  })

  it('handles escaped quotes', () => {
    expect(csvParse('name,note\nAlice,"say ""hi"""')).toEqual([{ name: 'Alice', note: 'say "hi"' }])
  })

  it('returns empty array for missing data rows', () => {
    expect(csvParse('name,age')).toEqual([])
  })

  it('handles CRLF line endings', () => {
    expect(csvParse('a,b\r\n1,2')).toEqual([{ a: '1', b: '2' }])
  })
})

describe('csvStringify', () => {
  it('serializes objects to CSV', () => {
    expect(csvStringify([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }])).toBe('name,age\nAlice,30\nBob,25')
  })

  it('escapes commas in values', () => {
    expect(csvStringify([{ note: 'hello, world' }])).toBe('note\n"hello, world"')
  })

  it('escapes double quotes', () => {
    expect(csvStringify([{ note: 'say "hi"' }])).toBe('note\n"say ""hi"""')
  })

  it('supports custom separator', () => {
    expect(csvStringify([{ a: '1', b: '2' }], { separator: ';' })).toBe('a;b\n1;2')
  })

  it('returns empty string for empty rows', () => {
    expect(csvStringify([])).toBe('')
  })

  it('round-trips with csvParse', () => {
    const data = [{ name: 'Alice', age: '30' }, { name: 'Bob', age: '25' }]

    expect(csvParse(csvStringify(data))).toEqual(data)
  })
})
