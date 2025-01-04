import { expandUuid, minifyUuid } from '../index'

const uuid = '550e8400-e29b-41d4-a716-446655440000'
const minified = minifyUuid(uuid)
console.log('Minified UUID:', minified)

const expanded = expandUuid(minified)
console.log('Expanded UUID:', expanded)
