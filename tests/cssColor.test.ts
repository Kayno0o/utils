import { afterEach, describe, expect, test as it } from 'bun:test'
import { parseCssColor } from '../src/browser/color'

/** Stands in for the browser: CSS vets the value, a canvas resolves it to sRGB. */
function stubBrowser({ supports = true, resolved = '#336699' }: { supports?: boolean, resolved?: string } = {}) {
  globalThis.CSS = { supports: () => supports } as unknown as typeof CSS
  // A real canvas answers with its own normalized form, whatever was written to it.
  const context = {
    written: '',
    set fillStyle(value: string) {
      this.written = value
    },
    get fillStyle() {
      return resolved
    },
  }

  globalThis.document = {
    createElement: () => ({ getContext: () => context }),
  } as unknown as Document

  return context
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'CSS')
  Reflect.deleteProperty(globalThis, 'document')
})

describe('parseCssColor', () => {
  it('reads the hex a canvas gives back for an opaque colour, trimming what it is handed', () => {
    const context = stubBrowser({ resolved: '#336699' })

    expect(parseCssColor(' rebeccapurple ')?.to('rgb')).toEqual([51, 102, 153])
    expect(context.written).toBe('rebeccapurple')
  })

  it('reads the channels a canvas gives back for a translucent one', () => {
    stubBrowser({ resolved: 'rgba(255, 0, 0, 0.5)' })

    expect(parseCssColor('#ff000080')?.to('rgba')).toEqual([255, 0, 0, 0.5])
  })

  it('refuses what CSS does not take, and blank input', () => {
    stubBrowser({ supports: false })

    expect(parseCssColor('not-a-colour')).toBeNull()
    expect(parseCssColor('   ')).toBeNull()
  })
})
