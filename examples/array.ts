import { groupBy } from '../src'

console.log(groupBy([
  { age: 12, name: 'A' },
  { age: 30, name: 'B' },
  { age: 20, name: 'C' },
], x => x.age < 18 ? 'minor' : 'major'))

console.log(groupBy([
  { age: 20, name: 'A' },
  { age: 30, name: 'B' },
  { age: 20, name: 'C' },
], x => x.age))
