import { Faker } from '../'

const faker = new Faker()

console.log(faker.name.username())
console.log(faker.text.sentence())
console.log(faker.text.paragraph())
console.log(faker.text.word())
