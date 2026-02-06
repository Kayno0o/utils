import { describe, expect, it } from 'bun:test'
import { buildUrlQuery, queryToNestedObject } from '../src'

describe('buildUrlQuery function', () => {
  it('should return an empty string when query is undefined', () => {
    const result = buildUrlQuery(undefined)

    expect(result).toBe('')
  })

  it('should return an empty string when query is null', () => {
    const result = buildUrlQuery(null)

    expect(result).toBe('')
  })

  it('should build a query string from an object', () => {
    const query = { age: 30, name: 'John' }
    const result = buildUrlQuery(query)

    expect(result).toBe('?age=30&name=John')
  })

  it('should exclude undefined and null values from the query string', () => {
    const query = { age: null, city: undefined, country: 'USA', name: 'John' }
    const result = buildUrlQuery(query)

    expect(result).toBe('?country=USA&name=John')
  })

  it('should return an empty string for an empty object', () => {
    const query = {}
    const result = buildUrlQuery(query)

    expect(result).toBe('')
  })

  it('should handle a query with special characters', () => {
    const query = { 'city!': 'New York', 'name': 'John Doe' }
    const result = buildUrlQuery(query)

    expect(result).toBe('?city!=New York&name=John Doe')
  })
})

describe('queryToNestedObject function', () => {
  it('should handle basic query', () => {
    const query = { key: 'value' }
    const result = queryToNestedObject(query)

    expect(result).toBeObject()
    expect(result).toEqual({ key: 'value' })
  })

  it('should handle basic query object', () => {
    const query = { 'sort[key]': 'ASC' }
    const result = queryToNestedObject(query)

    expect(result).toEqual({ sort: { key: 'ASC' } })
  })

  it('should handle multiple query object keys', () => {
    const query = { 'sort[key]': 'ASC', 'sort[id]': 'DESC' }
    const result = queryToNestedObject(query)

    expect(result).toEqual({ sort: { key: 'ASC', id: 'DESC' } })
  })

  it('should ignore already set key', () => {
    const query = { 'sort[key]': 'DESC', 'sort': 'DESC' }
    const result = queryToNestedObject(query)

    expect(result).toEqual({ sort: { key: 'DESC' } })
  })

  it('should handle deeply nested objects', () => {
    const query = { 'key1[key2][key3][key4][key5]': 'value' }
    const result = queryToNestedObject(query)

    expect(result).toEqual({ key1: { key2: { key3: { key4: { key5: 'value' } } } } })
  })

  it('should skip invalid key', () => {
    const query = { 'key1[key2]key3': 'value' }
    const result = queryToNestedObject(query)

    expect(result).toEqual({ key1: { key2: 'value' } })
  })
})
