import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import * as root from '../src'
import * as browserFetch from '../src/browser/fetch'
import * as encoding from '../src/encoding'
import * as coreFetch from '../src/fetch'
import * as mask from '../src/mask'
import * as search from '../src/search'
import * as spans from '../src/spans'
import * as text from '../src/text'
import * as ansi from '../src/tools/ansi'
import * as toolColors from '../src/tools/colors'

describe('module boundaries', () => {
  it('exposes the full HTTP transport from root and keeps browser/fetch compatible', () => {
    expect(root.fetchJson).toBe(coreFetch.fetchJson)
    expect(root.createFetcher).toBe(coreFetch.createFetcher)
    expect(root.readNdjson).toBe(coreFetch.readNdjson)
    expect(root.FetchError).toBe(coreFetch.FetchError)
    expect(browserFetch.fetchJson).toBe(coreFetch.fetchJson)
    expect(browserFetch.FetchError).toBe(coreFetch.FetchError)
  })

  it('re-exports split text submodules from text.ts', () => {
    expect(text.base64Encode).toBe(encoding.base64Encode)
    expect(text.mask).toBe(mask.mask)
    expect(text.searchFuzzy).toBe(search.searchFuzzy)
    expect(text.tokenizeLines).toBe(spans.tokenizeLines)
  })

  it('aliases tools/colors to tools/ansi', () => {
    expect(toolColors.colors).toBe(ansi.colors)
    expect(toolColors.createColors).toBe(ansi.createColors)
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
})
