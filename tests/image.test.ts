import { describe, expect, test as it } from 'bun:test'
import { getPlaceholderUrl } from '../src'

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

    expect(result).toEqual('https://placehold.co/150x150/png?font=roboto&text=Hello+World')
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
