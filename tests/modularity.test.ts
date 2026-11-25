import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import * as root from '../src'
import * as browser from '../src/browser'
import * as encoding from '../src/encoding'
import * as coreFetch from '../src/fetch'
import * as mask from '../src/mask'
import * as search from '../src/search'
import * as spans from '../src/spans'
import * as text from '../src/text'

describe('module boundaries', () => {
  it('exposes the full HTTP transport from root and excludes it from browser barrel', () => {
    expect(root.fetchJson).toBe(coreFetch.fetchJson)
    expect(root.createFetcher).toBe(coreFetch.createFetcher)
    expect(root.readNdjson).toBe(coreFetch.readNdjson)
    expect(root.FetchError).toBe(coreFetch.FetchError)
    expect('fetchJson' in browser).toBe(false)
    expect('htmlToMarkdown' in browser).toBe(false)
  })

  it('keeps optional peer and Bun-only modules out of root', () => {
    expect('qrCodeSvg' in root).toBe(false)
    expect('hashPassword' in root).toBe(false)
  })

  it('re-exports split text submodules from text.ts', () => {
    expect(text.base64Encode).toBe(encoding.base64Encode)
    expect(text.mask).toBe(mask.mask)
    expect(text.searchFuzzy).toBe(search.searchFuzzy)
    expect(text.tokenizeLines).toBe(spans.tokenizeLines)
  })

  it('bundles encoding standalone without pulling mask or search', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'encoding-'))
    const entry = join(dir, 'entry.ts')

    try {
      writeFileSync(entry, `import { base64Encode } from '${join(import.meta.dir, '../src/encoding')}'\nconsole.log(base64Encode('hi'))\n`)
      const { outputs } = await Bun.build({ entrypoints: [entry], target: 'browser', minify: true })
      const code = await outputs[0]!.text()

      expect(code).not.toContain('REDACTED')
      expect(code.length).toBeLessThan(1500)
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('bundles root and browser entrypoints with zero external runtime dependencies', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'zero-dep-'))
    const rootEntry = join(dir, 'root.ts')
    const browserEntry = join(dir, 'browser.ts')

    try {
      writeFileSync(rootEntry, `export * from '${join(import.meta.dir, '../src/index')}'\n`)
      writeFileSync(browserEntry, `export * from '${join(import.meta.dir, '../src/browser/index')}'\n`)

      const { outputs: rootOutputs } = await Bun.build({ entrypoints: [rootEntry], target: 'browser', external: ['uqr', 'turndown', '@joplin/turndown-plugin-gfm'] })
      const { outputs: browserOutputs } = await Bun.build({ entrypoints: [browserEntry], target: 'browser', external: ['uqr', 'turndown', '@joplin/turndown-plugin-gfm'] })

      const rootCode = await rootOutputs[0]!.text()
      const browserCode = await browserOutputs[0]!.text()

      expect(rootCode).not.toContain('uqr')
      expect(rootCode).not.toContain('turndown')
      expect(browserCode).not.toContain('turndown')
      expect(browserCode).not.toContain('uqr')
    }
    finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
