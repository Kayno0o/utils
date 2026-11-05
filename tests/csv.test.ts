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

  it('returns the header line for empty rows with explicit headers', () => {
    expect(stringifyCsv([], { headers: ['a', 'b'], separator: ';' })).toBe('a;b')
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

describe('parseCsv options', () => {
  it('keys rows by column index without a header row', () => {
    expect(parseCsv('a,b\nc,d', { headers: false })).toEqual([{ 0: 'a', 1: 'b' }, { 0: 'c', 1: 'd' }])
  })

  it('names the columns of every row with given headers', () => {
    expect(parseCsv('a,b\nc,d', { headers: ['x', 'y'] })).toEqual([{ x: 'a', y: 'b' }, { x: 'c', y: 'd' }])
  })

  it('trims fields', () => {
    expect(parseCsv('name , age\n Ana ,  3', { trim: true })).toEqual([{ name: 'Ana', age: '3' }])
  })

  it('keeps empty lines with skipEmptyLines off, but not the trailing line break', () => {
    expect(parseCsv('a\n1\n\n2\n', { skipEmptyLines: false })).toEqual([{ a: '1' }, { a: '' }, { a: '2' }])
    expect(parseCsv('a\n1\n\n2\n')).toEqual([{ a: '1' }, { a: '2' }])
  })
})

describe('stringifyCsv options', () => {
  it('writes CRLF line endings and a BOM', () => {
    const csv = stringifyCsv([{ a: 1 }, { a: 2 }], { newline: '\r\n', bom: true })

    expect(csv).toBe('﻿a\r\n1\r\n2')
  })

  it('quotes fields holding a carriage return, and headers holding the separator', () => {
    expect(stringifyCsv([{ 'a;b': 'x\ry' }], { separator: ';' })).toBe('"a;b"\n"x\ry"')
  })

  it('round-trips through parseCsv', () => {
    const rows = [{ name: 'Ana "A"', note: 'line\r\nbreak' }]

    expect(parseCsv(stringifyCsv(rows, { newline: '\r\n' }))).toEqual([{ name: 'Ana "A"', note: 'line\nbreak' }])
  })
})
