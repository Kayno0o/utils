import { expandUUID, minifyUUID } from '../src'
import { Faker } from '../src/tools'

const uuid = Faker.datatype.uuidV4()
const minified = minifyUUID(uuid)

console.log(uuid)
console.log(minified)
console.log(expandUUID(minified))
