import { afterEach, describe, expect, it } from 'bun:test'
import { copy } from '../src/browser/clipboard'

const globals = globalThis as Record<string, unknown>
const original = { navigator: globals.navigator, ClipboardItem: globals.ClipboardItem }

/** A clipboard that records the formats each write carried, as text. */
function fakeClipboard(): Record<string, string>[] {
  const writes: Record<string, string>[] = []

  globals.ClipboardItem = class {
    constructor(readonly items: Record<string, Blob>) {}
  }

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        write: async (items: { items: Record<string, Blob> }[]) => {
          for (const item of items)
            writes.push(Object.fromEntries(await Promise.all(Object.entries(item.items).map(async ([type, blob]) => [type, await blob.text()]))))
        },
      },
    },
  })

  return writes
}

afterEach(() => {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: original.navigator })
  globals.ClipboardItem = original.ClipboardItem
})

describe('copy', () => {
  it('writes plain text alone', async () => {
    const writes = fakeClipboard()

    await copy('hello')

    expect(writes).toEqual([{ 'text/plain': 'hello' }])
  })

  it('writes an html version alongside when given one', async () => {
    const writes = fakeClipboard()

    await copy('**hi**', { html: '<strong>hi</strong>' })

    expect(writes).toEqual([{ 'text/plain': '**hi**', 'text/html': '<strong>hi</strong>' }])
  })
})
