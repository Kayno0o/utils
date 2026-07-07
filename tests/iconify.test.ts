import { describe, expect, test as it } from 'bun:test'
import { createIconify } from '../src/tools'

const { getIconData, has, renderSvg, inlineIconUrl } = createIconify({
  ti: {
    icons: {
      home: { body: '<path d="M3 12l9-9 9 9"/>' },
      wide: { body: '<rect/>', width: 32, height: 16 },
    },
  },
  mdi: {
    width: 20,
    height: 20,
    icons: {
      star: { body: '<path d="M0 0"/>' },
    },
  },
})

describe('createIconify', () => {
  it('returns svg body and default viewBox', () => {
    expect(getIconData('ti:home')).toStrictEqual({
      svg: '<path d="M3 12l9-9 9 9"/>',
      viewBox: '0 0 24 24',
    })
  })

  it('uses per-icon dimensions', () => {
    expect(getIconData('ti:wide')).toStrictEqual({
      svg: '<rect/>',
      viewBox: '0 0 32 16',
    })
  })

  it('falls back to library dimensions', () => {
    expect(getIconData('mdi:star')).toStrictEqual({
      svg: '<path d="M0 0"/>',
      viewBox: '0 0 20 20',
    })
  })

  it('returns null for unknown prefix', () => {
    expect(getIconData('xx:home' as never)).toBeNull()
  })

  it('returns null for unknown icon', () => {
    expect(getIconData('ti:missing' as never)).toBeNull()
  })

  it('has narrows known names', () => {
    expect(has('ti:home')).toBe(true)
    expect(has('ti:missing')).toBe(false)
  })

  it('renders svg markup with attrs', () => {
    expect(renderSvg('ti:home', { class: 'icon', width: 24 })).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon" width="24"><path d="M3 12l9-9 9 9"/></svg>',
    )
    expect(renderSvg('ti:missing' as never)).toBe('')
  })

  it('builds an inline data url', () => {
    expect(inlineIconUrl('ti:home')).toBe(
      `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 12l9-9 9 9"/></svg>')}`,
    )
    expect(inlineIconUrl('ti:missing' as never)).toBe('')
  })
})
