import { declareGetEndpoint } from '../index'

const endpoints = {
  project: '/api/projects/{uuid}',
  projects: '/api/projects',
  test: '/api/test/{test}',
  test2: '/api/test/{test}',
}

export interface MyEndpointType {
  project: {
    uuid: string
  }
  test: {
    test: 'path'
  }
  test2: {
    test: 'path' | '123'
  }
}

const getEndpoint = declareGetEndpoint<typeof endpoints, MyEndpointType>(endpoints)

console.log(getEndpoint(['project', { uuid: 'test123' }]))
console.log(getEndpoint(['projects']))
console.log(getEndpoint(['test', { test: 'path' }]))
console.log(getEndpoint(['test2', { test: '123' }]))
