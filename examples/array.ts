import { groupBy, partition, sortBy } from '../src'

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

console.log(partition([1, 2, 3, 4, 5], n => n % 2 === 0))

console.log(sortBy([{ name: 'Charlie' }, { name: 'Alice' }], x => x.name))
console.log(sortBy([3, 1, 2], x => x, 'desc'))
