import { performance } from 'node:perf_hooks'
import chalk from 'chalk'
import { progressBar, randomHex, randomInt, randomText, uuidV4 } from './'

async function warmup(callback: () => any, duration = 1000) {
  const endTime = performance.now() + duration
  while (performance.now() < endTime) {
    await callback()
  }
}

async function benchmark(name: string, callback: () => any, iterations = 1_000_000, { verbose = true } = {}) {
  if (verbose)
    console.log(chalk.cyan.bold('[Benchmark]'), name)

  // Warm-up phase
  await warmup(callback)

  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    callback()
  }

  const endTime = performance.now()

  const timeTaken = endTime - startTime

  if (verbose) {
    console.log(chalk.green('[Time]  '), `${Number(timeTaken.toFixed(2))} ms`)
  }

  return { timeTaken }
}

async function suite(benchmarks: [string, () => any][], iterations = 1_000_000) {
  const results: { name: string, timeTaken: number }[] = []

  for (const [name, callback] of benchmarks) {
    const result = await benchmark(name, callback, iterations, { verbose: false })
    results.push({ name, ...result })
  }

  const maxTime = Math.max(...results.map(result => result.timeTaken))

  console.log(chalk.magenta.bold('\n[Comparison]'))

  for (const result of results) {
    // const timeColor = result.timeTaken === maxTime ? chalk.red : chalk.yellow
    const timeColor = [chalk.green, chalk.red][Number(result.timeTaken === maxTime)]

    console.log(chalk.yellow.bold(result.name))
    console.log(chalk.blue('[Time]  '), progressBar(result.timeTaken, 0, maxTime), timeColor(`${result.timeTaken.toFixed(2)} ms`))
  }
}

console.clear()

await suite([
  ['randomInt', () => randomInt(1, 100, false)],
  ['randomInt:crypto', () => randomInt(1, 100, true)],
], 1_000_000)

await suite([
  ['randomText:50', () => randomText({ isCrypto: false, length: 50 })],
  ['randomText:50:crypto', () => randomText({ isCrypto: true, length: 50 })],
], 1_000)

await suite([
  ['uuidV4', () => uuidV4()],
  ['uuidV4:crypto', () => uuidV4(true)],
], 10_000)

await suite([
  ['randomHex', () => randomHex()],
  ['randomHex:crypto', () => randomHex(true)],
])

console.log()
