import { performance } from 'node:perf_hooks'
import { heapStats } from 'bun:jsc'
import chalk from 'chalk'
import { progressBar, randomHex, randomInt, range, searchOne } from './'
import { Faker } from './src/fakerUtils'

interface BenchmarkOptions {
  iterations: number
  verbose?: boolean
}

async function warmup(callback: () => any | Promise<any>, duration = 1000) {
  const end = performance.now() + duration
  while (performance.now() < end) {
    await callback()
  }
}

async function benchmark(
  name: string,
  callback: () => any | Promise<any>,
  { iterations, verbose = true }: BenchmarkOptions,
) {
  if (verbose)
    console.log(chalk.cyan.bold('[Benchmark]'), name)

  await warmup(callback, 300)

  const memBefore = process.memoryUsage.rss()
  let peakMem = memBefore

  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    await callback()
    const mem = process.memoryUsage.rss()
    if (mem > peakMem)
      peakMem = mem
  }

  const endTime = performance.now()
  const timeTaken = endTime - startTime
  const memAfter = process.memoryUsage.rss()
  const heapAfter = heapStats()

  if (verbose) {
    console.log(chalk.green('[Time]   '), `${timeTaken.toFixed(2)} ms`)
    console.log(chalk.green('[Memory] '), `${(memAfter / 1024 / 1024).toFixed(2)} MB`)
  }

  return {
    timeTaken,
    peakMemoryMB: Math.round(peakMem / 1024 / 1024),
    finalHeapStats: heapAfter,
  }
}

async function suite(
  benchmarks: [string, () => any | Promise<any>][],
  iterations: number,
) {
  const search = process.argv.slice(2).join(' ')
  benchmarks = benchmarks.filter(([name]) => searchOne(search, name))
  if (!benchmarks.length)
    return

  const results: {
    name: string
    timeTaken: number
    peakMemoryMB: number
  }[] = []

  for (const [name, callback] of benchmarks) {
    const { timeTaken, peakMemoryMB } = await benchmark(name, callback, {
      iterations,
      verbose: false,
    })
    results.push({ name, timeTaken, peakMemoryMB })
  }

  const maxTime = Math.max(...results.map(result => result.timeTaken))

  console.log(chalk.magenta.bold('\n[Comparison]'))

  for (const result of results) {
    const timeColor = [chalk.green, chalk.red][Number(result.timeTaken === maxTime)]

    console.log(chalk.yellow.bold(result.name))
    console.log(
      chalk.blue('[Time]   '),
      progressBar(result.timeTaken, 0, maxTime),
      timeColor(`${(result.timeTaken / iterations).toFixed(3)} ms`),
    )
    console.log(
      chalk.blue('[Memory] '),
      chalk.gray(`~${result.peakMemoryMB} MB`),
    )
  }
}

console.clear()

await suite([
  ['randomInt', () => randomInt(1, 100, false)],
  ['randomInt:crypto', () => randomInt(1, 100, true)],
], 1_000_000)

await suite([
  ['faker.text:paragraph:50', () => Faker.lorem({ isCrypto: false, length: 50, type: 'paragraph' })],
  ['faker.text:paragraph:50:crypto', () => Faker.lorem({ isCrypto: true, length: 50, type: 'paragraph' })],
], 1_000)

await suite([
  ['faker.uuidV4', () => Faker.datatype.uuidV4()],
  ['faker.uuidV4:crypto', () => Faker.datatype.uuidV4(true)],
], 10_000)

await suite([
  ['randomHex', () => randomHex()],
  ['randomHex:crypto', () => randomHex(true)],
], 1_000_000)

await suite([
  ['range:10', () => range(10)],
  ['range:90-100', () => range(90, 100)],
], 1_000_000)

console.log()
