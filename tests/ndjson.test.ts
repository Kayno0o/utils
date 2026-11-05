import { describe, expect, test as it } from 'bun:test'
import { readNdjson } from '../src/browser/fetch'

function trackedStream(chunks: string[]): { body: ReadableStream<Uint8Array<ArrayBuffer>>, cancelled: () => boolean } {
  const encoder = new TextEncoder()
  let cancelled = false
  let index = 0
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>({
    pull(controller) {
      if (index < chunks.length)
        controller.enqueue(encoder.encode(chunks[index++]))
      else
        controller.close()
    },
    cancel() {
      cancelled = true
    },
  })

  return { body, cancelled: () => cancelled }
}

describe('readNdjson', () => {
  it('reads one value per line, a line split across chunks included', async () => {
    const { body } = trackedStream(['{"a":1}\n{"a"', ':2}\n\n{"a":3}'])

    expect(await Array.fromAsync(readNdjson(body))).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }])
  })

  it('cancels the body when the consumer stops early', async () => {
    const stream = trackedStream(['{"a":1}\n', '{"a":2}\n', '{"a":3}\n'])
    const lines = readNdjson(stream.body)

    expect((await lines.next()).value).toEqual({ a: 1 })
    await lines.return()
    expect(stream.cancelled()).toBe(true)
  })

  it('cancels the body and names the line on a line that is not JSON', async () => {
    const stream = trackedStream(['{"a":1}\n', 'oops\n', '{"a":3}\n'])

    await expect(Array.fromAsync(readNdjson(stream.body))).rejects.toThrow('Invalid NDJSON at line 2: oops')
    expect(stream.cancelled()).toBe(true)
  })
})
