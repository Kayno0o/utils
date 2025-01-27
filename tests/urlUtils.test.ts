import { describe, expect, it } from 'bun:test'
import { buildUrlQuery } from '~'

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
