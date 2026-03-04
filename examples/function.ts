import { once, sleep, throttle } from '../src'

const start = performance.now()
const fn = throttle(() => {
  console.log(`called at ${performance.now() - start}`)
}, 100)

fn()
await sleep(50)
fn()
await sleep(50)
fn()

const fnOnce = once((nb: number) => {
  console.log('called once:', nb)

  return nb
})

console.log(fnOnce(12))
console.log(fnOnce(24))
