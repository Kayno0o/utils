import { sleep, throttle } from '../src'

const start = performance.now()
const fn = throttle(() => {
  console.log(`called at ${performance.now() - start}`)
}, 100)

fn()
await sleep(50)
fn()
await sleep(50)
fn()
