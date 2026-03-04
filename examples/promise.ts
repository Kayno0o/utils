import { retry, sleep, timeout } from '../src'

const startTime = performance.now()

retry(async (retryCount) => {
  console.log(retryCount, performance.now() - startTime)

  if (retryCount < 3)
    throw new Error(`retry: ${retryCount}`)
}, {
  attempts: 4,
  backoff: 2,
  delay: 50,
})

try {
  timeout(async () => {
    await sleep(1000)
  }, 900)
}
catch (e) {
  console.error(e)
}
