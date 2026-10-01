import { afterEach, describe, expect, it } from 'bun:test'
import { copy, htmlToMarkdown } from '../src/browser/clipboard'

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

describe('htmlToMarkdown', () => {
  it('turns a table into a markdown one', () => {
    const html = '<table><thead><tr><th>Domain</th><th>Type</th></tr></thead><tbody><tr><td>example.com.</td><td>NS</td></tr></tbody></table>'

    expect(htmlToMarkdown(html)).toBe('| Domain | Type |\n| --- | --- |\n| example.com. | NS  |')
  })

  it('gives a table with no heading row an empty one', () => {
    expect(htmlToMarkdown('<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>')).toBe('|     |     |\n| --- | --- |\n| a   | b   |\n| c   | d   |')
  })

  it('keeps strikethrough and headings', () => {
    expect(htmlToMarkdown('<h2>Title</h2><p><del>old</del> new</p>')).toBe('## Title\n\n~~old~~ new')
  })
})
