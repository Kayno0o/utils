import { Faker } from '../'

const faker = new Faker()

console.log(faker.name.username())
console.log(faker.lorem.sentence())
console.log(faker.lorem.paragraph())
console.log(faker.lorem.word())
console.log(faker.internet.email())
