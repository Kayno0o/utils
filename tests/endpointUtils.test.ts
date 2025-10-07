import { describe, expect, test as it } from 'bun:test'
import { declareGetEndpoint } from '../src/builders'

describe('declareGetEndpoint function', () => {
  const endpoints = {
    project: '/api/projects/{uuid}',
    projects: '/api/projects',
    test: '/api/test/{test}',
    test2: '/api/test/{test}',
  } as const

  interface MyEndpointType {
    test: { test: 'path' }
    test2: { test: 'path' | '123' }
  }

  const getEndpoint = declareGetEndpoint<typeof endpoints, MyEndpointType>(endpoints)

  it('should return an endpoint URL with parameters replaced', () => {
    const result = getEndpoint('project', { uuid: 'test123' })

    expect(result).toBe('/api/projects/test123')
  })

  it('should return an endpoint URL without parameters', () => {
    const result = getEndpoint('projects')

    expect(result).toBe('/api/projects')
  })

  it('should replace parameters in the "test" endpoint', () => {
    const result = getEndpoint('test', { test: 'path' })

    expect(result).toBe('/api/test/path')
  })

  it('should handle multiple allowed values for a parameter', () => {
    const result1 = getEndpoint('test2', { test: '123' })

    expect(result1).toBe('/api/test/123')

    const result2 = getEndpoint('test2', { test: 'path' })

    expect(result2).toBe('/api/test/path')
  })

  it('should return undefined if the endpoint does not exist', () => {
    const result = getEndpoint('nonexistent' as any)

    expect(result).toBeUndefined()
  })
})
