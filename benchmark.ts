import { bench, group, run } from 'mitata'
import { Faker, firstUpper, parseArgs, randomHex, randomInt, randomString, range, searchOne } from './index'

// console.clear()

const { filter } = parseArgs({
  args: process.argv.slice(2),
  options: {
    filter: { type: 'string', short: 'f' },
  },
})

if (!filter || searchOne(filter, 'randomInt')) {
  group('randomInt', () => {
    bench('Math.random', () => randomInt(1, 100, false))
    bench('crypto', () => randomInt(1, 100, true))
  })
}

if (!filter || searchOne(filter, 'faker paragraph')) {
  group('faker.text:paragraph:50', () => {
    bench('Math.random', () => Faker.lorem.paragraph(50, false))
    bench('crypto', () => Faker.lorem.paragraph(50, true))
  })
}

if (!filter || searchOne(filter, 'faker uuidV4')) {
  group('faker.uuidV4', () => {
    bench('Math.random', () => Faker.datatype.uuidV4())
    bench('crypto', () => Faker.datatype.uuidV4(true))
  })
}

if (!filter || searchOne(filter, 'randomHex')) {
  group('randomHex', () => {
    bench('Math.random', () => randomHex())
    bench('crypto', () => randomHex(true))
  })
}

if (!filter || searchOne(filter, 'range')) {
  group('range', () => {
    bench('range(10)', () => range(10))
    bench('range(90, 100)', () => range(90, 100))
  })
}

if (!filter || searchOne(filter, 'RGB to Hex conversion')) {
  const [r, g, b] = [124, 240, 0]

  group('RGB to Hex conversion', () => {
    bench('padStart', () => `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0').toUpperCase()}`)
    bench('bit shift + slice', () => `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`.toUpperCase())
    bench('string slice concat', () => {
      const hex = (r << 16 | g << 8 | b).toString(16)

      return `#${('000000'.slice(hex.length) + hex).toUpperCase()}`
    })
  })
}

if (!filter || searchOne(filter, 'firstUpper')) {
  const { Bench } = await import('tinybench')
  const s1000 = randomString(1000)
  const firstUpper2 = (str: string) => str.substring(0, 1).toUpperCase() + str.substring(1)
  const firstUpper3 = (str: string) => str.charAt(0).toUpperCase() + str.substring(1)
  const firstUpper4 = (str: string) => str[0].toUpperCase() + str.substring(1)
  const firstUpper5 = (str: string) => str[0].toUpperCase() + str.slice(1)

  const suite = new Bench({ name: 'firstUpper' })

  suite
    .add('charAt + slice', () => firstUpper(s1000))
    .add('substring x2', () => firstUpper2(s1000))
    .add('charAt + substring', () => firstUpper3(s1000))
    .add('[0] + substring', () => firstUpper4(s1000))
    .add('[0] + slice', () => firstUpper5(s1000))

  await suite.run()

  // Sort by performance (fastest first)
  const sorted = suite.tasks.sort((a, b) => a.result!.latency.mean - b.result!.latency.mean)
  const fastest = sorted[0].result!.latency.mean

  console.log('\n• firstUpper (sorted by speed)\n')
  let i = 0

  for (const task of sorted) {
    i++
    const result = task.result!
    const opsPerSec = (1_000_000_000 / result.latency.mean).toFixed(0)
    const relative = (result.latency.mean / fastest).toFixed(2)
    const marker = i === 0 ? '✓' : ' '

    console.log(`${marker} ${task.name.padEnd(20)} ${result.latency.mean.toFixed(2).padStart(6)} ns/iter  ${opsPerSec.padStart(12)} ops/s  ${relative}x`)
  }
}

await run()
