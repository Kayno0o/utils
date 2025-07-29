import { expandUUID, Faker, minifyUUID } from '~'

const uuid = Faker.datatype.uuidV4()
const minified = minifyUUID(uuid)
console.log(uuid)
console.log(minified)
console.log(expandUUID(minified))
