import { describe, expect, test as it } from 'bun:test'
import { parseCsv, stringifyCsv } from '../src'

describe('parseCsv', () => {
  it('parses basic CSV', () => {
    expect(parseCsv('name,age\nAlice,30\nBob,25')).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ])
  })

  it('supports custom separator', () => {
    expect(parseCsv('a;b\n1;2', { separator: ';' })).toEqual([{ a: '1', b: '2' }])
  })

  it('handles quoted fields', () => {
    expect(parseCsv('name,note\nAlice,"hello, world"')).toEqual([{ name: 'Alice', note: 'hello, world' }])
  })

  it('handles escaped quotes', () => {
    expect(parseCsv('name,note\nAlice,"say ""hi"""')).toEqual([{ name: 'Alice', note: 'say "hi"' }])
  })

  it('returns empty array for missing data rows', () => {
    expect(parseCsv('name,age')).toEqual([])
  })

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([{ a: '1', b: '2' }])
  })

  it('handles multi-line quoted fields', () => {
    expect(parseCsv('a,b\n1,"line1\nline2"')).toEqual([{ a: '1', b: 'line1\nline2' }])
  })
})

describe('stringifyCsv', () => {
  it('serializes objects to CSV', () => {
    expect(stringifyCsv([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }])).toBe('name,age\nAlice,30\nBob,25')
  })

  it('escapes commas in values', () => {
    expect(stringifyCsv([{ note: 'hello, world' }])).toBe('note\n"hello, world"')
  })

  it('escapes double quotes', () => {
    expect(stringifyCsv([{ note: 'say "hi"' }])).toBe('note\n"say ""hi"""')
  })

  it('supports custom separator', () => {
    expect(stringifyCsv([{ a: '1', b: '2' }], { separator: ';' })).toBe('a;b\n1;2')
  })

  it('returns empty string for empty rows', () => {
    expect(stringifyCsv([])).toBe('')
  })

  it('round-trips with parseCsv', () => {
    const data = [{ name: 'Alice', age: '30' }, { name: 'Bob', age: '25' }]

    expect(parseCsv(stringifyCsv(data))).toEqual(data)
  })

  it('escapes newlines in values', () => {
    expect(stringifyCsv([{ note: 'line1\nline2' }])).toBe('note\n"line1\nline2"')
  })

  it('round-trips multi-line fields', () => {
    const data = [{ a: '1', b: 'line1\nline2' }]

    expect(parseCsv(stringifyCsv(data))).toEqual(data)
  })
})
