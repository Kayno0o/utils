import { declareGetEndpoint } from '~'

const endpoints = {
  project: '/api/projects/{uuid}',
  projects: '/api/projects',
  test: '/api/test/{test}',
  test2: '/api/test/{test}',
  user: '/api/users/{id}',
} as const

const getEndpoint = declareGetEndpoint<typeof endpoints, {
  user: { id: number }
}>(endpoints)

console.log(getEndpoint(['project', { uuid: 'test123' }])) // /api/projects/test123
console.log(getEndpoint(['projects'])) // /api/projects
console.log(getEndpoint(['test', { test: 'path' }])) // /api/test/path
console.log(getEndpoint(['test2', { test: '123' }])) // /api/test/123
console.log(getEndpoint(['user', { id: 123 }])) // /api/users/123
