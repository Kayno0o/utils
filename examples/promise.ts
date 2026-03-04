import { retry } from '../src'

const startTime = performance.now()

retry(async (retryCount) => {
  console.log(retryCount, performance.now() - startTime)

  if (retryCount < 3)
    throw new Error(`retry: ${retryCount}`)
}, {
  attempts: 4,
  backoff: 2,
  delay: 100,
})
