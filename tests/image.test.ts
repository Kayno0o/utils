import { afterAll, afterEach, beforeAll, describe, expect, test as it, spyOn } from 'bun:test'
import { getPlaceholderUrl } from '../src'
import { dataUrlToBlob, resolveImageFromUrl, transformImage } from '../src/browser/image'

describe('getPlaceholderUrl function', () => {
  it('should return a default URL when no props are provided', () => {
    const result = getPlaceholderUrl({})

    expect(result).toEqual('https://placehold.co/100x100')
  })

  it('should include width and height in the URL', () => {
    const result = getPlaceholderUrl({ height: 300, width: 200 })

    expect(result).toEqual('https://placehold.co/200x300')
  })

  it('should include background color and color in the path', () => {
    const result = getPlaceholderUrl({
      backgroundColor: '000000',
      color: 'FFFFFF',
      height: 300,
      width: 200,
    })

    expect(result).toEqual('https://placehold.co/200x300/000000/FFFFFF')
  })

  it('should include font and format in the query string', () => {
    const result = getPlaceholderUrl({
      font: 'roboto',
      format: 'png',
      height: 150,
      text: 'Hello World',
      width: 150,
    })

    expect(result).toEqual('https://placehold.co/150x150/png?font=roboto&text=Hello%20World')
  })

  it('keeps a + or & in the text as written', () => {
    expect(getPlaceholderUrl({ text: 'A+B & C' })).toBe('https://placehold.co/100x100?text=A%2BB%20%26%20C')
  })

  it('should encode text with spaces and newlines correctly', () => {
    const result = getPlaceholderUrl({
      height: 100,
      text: 'Line1\nLine2',
      width: 100,
    })

    expect(result).toEqual('https://placehold.co/100x100?text=Line1%5CnLine2')
  })

  it('should include only the specified format when no colors are provided', () => {
    const result = getPlaceholderUrl({ format: 'jpg', height: 200, width: 200 })

    expect(result).toEqual('https://placehold.co/200x200/jpg')
  })
})

describe('dataUrlToBlob function', () => {
  it('should decode the bytes and keep the mime type', async () => {
    const blob = dataUrlToBlob('data:image/png;base64,aGVsbG8=')

    expect(blob.type).toEqual('image/png')
    expect(await blob.text()).toEqual('hello')
  })

  it('should fall back to a generic type when the head names none', () => {
    expect(dataUrlToBlob('data:;base64,aGVsbG8=').type).toEqual('application/octet-stream')
  })
})

describe('resolveImageFromUrl function', () => {
  class MockFileReader extends EventTarget {
    result: string | null = null

    async readAsDataURL(file: File) {
      this.result = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`
      this.dispatchEvent(new Event('load'))
    }
  }

  const originalFileReader = globalThis.FileReader

  beforeAll(() => {
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader
  })

  afterAll(() => {
    globalThis.FileReader = originalFileReader
  })

  afterEach(() => {
    spyOn(globalThis, 'fetch').mockRestore()
  })

  it('returns the image as a data URL keeping its type', async () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Blob(['png'], { type: 'image/png' })))

    expect(await resolveImageFromUrl('https://example.com/a.png')).toBe('data:image/png;base64,cG5n')
  })

  it('returns null for an error response', async () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not found', { status: 404 }))

    expect(await resolveImageFromUrl('https://example.com/missing.png')).toBeNull()
  })
})

describe('transformImage function', () => {
  const originals = { Image: globalThis.Image, document: globalThis.document }
  const noop = () => undefined
  const ctx = { translate: noop, scale: noop, rotate: noop, drawImage: noop }

  beforeAll(() => {
    globalThis.Image = class {
      naturalWidth = 40
      naturalHeight = 20
      onload: (() => void) | null = null
      #src = ''

      get src() {
        return this.#src
      }

      set src(value: string) {
        this.#src = value
        queueMicrotask(() => this.onload?.())
      }
    } as unknown as typeof Image
    globalThis.document = {
      createElement: () => ({ getContext: () => ctx, toDataURL: (format: string, quality?: number) => `${format}|${quality}` }),
    } as unknown as Document
  })

  afterAll(() => {
    globalThis.Image = originals.Image
    globalThis.document = originals.document
  })

  it('outputs a png by default', async () => {
    expect(await transformImage('a.png', { rotate: 90, flipH: false, flipV: false })).toEqual({ src: 'image/png|undefined', width: 20, height: 40 })
  })

  it('outputs the given format and quality', async () => {
    expect((await transformImage('a.png', { rotate: 0, flipH: false, flipV: false }, { format: 'image/webp', quality: 0.7 })).src).toBe('image/webp|0.7')
  })
})
