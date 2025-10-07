import { declareGetEndpoint } from '../src/builders'

const endpoints = {
  project: '/api/projects/{uuid}',
  projects: '/api/projects',
  test: '/api/test/{test}',
  test2: '/api/test/{test}',
  user: '/api/users/{id}',
  user2: '/api/users/{1}',
} as const

const getEndpoint = declareGetEndpoint<typeof endpoints, {
  user: { id: 'id1' | 'id2' }
}>(endpoints)

console.log(getEndpoint('project', { uuid: 'test123' })) // /api/projects/test123
console.log(getEndpoint('projects')) // /api/projects
console.log(getEndpoint('test', { test: 'path' })) // /api/test/path
console.log(getEndpoint('test2', { test: '123' })) // /api/test/123
console.log(getEndpoint('user', { id: 'id1' })) // /api/users/123
console.log(getEndpoint('user2', { 1: 'id1' })) // /api/users/123
