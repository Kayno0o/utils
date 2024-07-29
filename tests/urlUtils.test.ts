import { describe, expect, it } from 'bun:test'
import { buildQuery } from '../src/urlUtils'

describe('buildQuery function', () => {
  it('should return an empty string when query is undefined', () => {
    const result = buildQuery(undefined)
    expect(result).toBe('')
  })

  it('should return an empty string when query is null', () => {
    const result = buildQuery(null)
    expect(result).toBe('')
  })

  it('should build a query string from an object', () => {
    const query = { age: 30, name: 'John' }
    const result = buildQuery(query)
    expect(result).toBe('?name=John&age=30')
  })

  it('should exclude undefined and null values from the query string', () => {
    const query = { age: null, city: undefined, country: 'USA', name: 'John' }
    const result = buildQuery(query)
    expect(result).toBe('?name=John&country=USA')
  })

  it('should return an empty string for an empty object', () => {
    const query = {}
    const result = buildQuery(query)
    expect(result).toBe('')
  })

  it('should handle a query with special characters', () => {
    const query = { 'city!': 'New York', 'name': 'John Doe' }
    const result = buildQuery(query)
    expect(result).toBe('?name=John Doe&city!=New York')
  })
})
