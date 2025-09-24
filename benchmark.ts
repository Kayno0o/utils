import { performance } from 'node:perf_hooks'
import { colors, Faker, progressBar, randomHex, randomInt, randomString, range, searchOne } from './index'

interface BenchmarkOptions {
  iterations?: number
  verbose?: boolean
  /** in ms */
  warmup?: number
}

function warmup(callback: () => void, duration = 1000) {
  const end = performance.now() + duration
  while (performance.now() < end)
    callback()
}

function benchmark(name: string, callback: () => void, { iterations = 1_000, verbose = true, warmup: warmupMs = 1_000 }: BenchmarkOptions) {
  if (verbose)
    console.log(colors.cyan.bold('[Benchmark]'), name)

  warmup(callback, warmupMs)

  const startTime = performance.now()

  for (let i = 0; i < iterations; i++)
    callback()

  const endTime = performance.now()
  const timeTaken = endTime - startTime

  if (verbose)
    console.log(colors.green('[Time]   '), `${timeTaken.toFixed(10)} ms`)

  return timeTaken
}

function suite(benchmarks: [string, () => void][], options: BenchmarkOptions = {}) {
  const search = process.argv.slice(2).join(' ')
  benchmarks = benchmarks.filter(([name]) => searchOne(search, name))
  if (!benchmarks.length)
    return

  const results: {
    name: string
    timeTaken: number
  }[] = []

  for (const [name, callback] of benchmarks)
    results.push({ name, timeTaken: benchmark(name, callback, options) })

  const maxTime = Math.max(...results.map(result => result.timeTaken))

  console.log(colors.magenta.bold('\n[Comparison]'))

  const longestName = results.reduce((acc, curr) => curr.name.length > acc ? curr.name.length : acc, 0)

  for (const result of results) {
    const timeColor = [colors.green, colors.red][Number(result.timeTaken === maxTime)]

    console.log(' '.repeat(longestName - result.name.length) + colors.yellow.bold(result.name), progressBar(result.timeTaken, 0, maxTime), timeColor(`${(result.timeTaken / (options.iterations ?? 1_000)).toFixed(10)} ms`))
  }
}

console.clear()

suite([
  ['randomInt', () => randomInt(1, 100, false)],
  ['randomInt:crypto', () => randomInt(1, 100, true)],
], { iterations: 1_000_000 })

suite([
  ['faker.text:paragraph:50', () => Faker.lorem({ isCrypto: false, length: 50, type: 'paragraph' })],
  ['faker.text:paragraph:50:crypto', () => Faker.lorem({ isCrypto: true, length: 50, type: 'paragraph' })],
], { iterations: 1_000 })

suite([
  ['faker.uuidV4', () => Faker.datatype.uuidV4()],
  ['faker.uuidV4:crypto', () => Faker.datatype.uuidV4(true)],
], { iterations: 10_000 })

suite([
  ['randomHex', () => randomHex()],
  ['randomHex:crypto', () => randomHex(true)],
], { iterations: 1_000_000 })

suite([
  ['range:10', () => range(10)],
  ['range:90-100', () => range(90, 100)],
], { iterations: 1_000_000 })

const s = randomString(10_000)
suite([
  ['colors', () => colors.red([`red`, colors.bold(s)].join(' '))],
  ['colors', () => colors.red([`red`, colors.bold(s)].join(' '))],
  ['colors', () => colors.red(`red ${colors.bold(s)}`)],
  ['colors', () => `${colors.red('red')} ${colors.red.bold(s)}`],
], { iterations: 1_000 })

const [r, g, b] = [124, 240, 0]
suite([
  ['rgb converted 00001', () => `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0').toUpperCase()}`],
  ['rgb converted 2', () => `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`.toUpperCase()],
  ['rgb converted 3', () => {
    const hex = (r << 16 | g << 8 | b).toString(16)
    return `#${('000000'.slice(hex.length) + hex).toUpperCase()}`
  }],
], { iterations: 1_000_000 })

console.log()
