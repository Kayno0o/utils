import type { TextSpan } from './text'
import { tokenizeLines, tokenizeWords } from './text'

export interface DiffHunk {
  aStart: number
  aEnd: number
  bStart: number
  bEnd: number
}

export interface TextEdit {
  offset: number
  length: number
  replacement: string
}

/**
 * Runs of tokens that differ between two sequences.
 *
 * The table holds the longest common subsequence of each pair of suffixes, filled bottom-up and
 * kept flat, so the walk that follows can pick which side to advance in constant time.
 */
export function diffTokens(a: TextSpan[], b: TextSpan[]): DiffHunk[] {
  const left = a.map(token => token.text)
  const right = b.map(token => token.text)
  const n = left.length
  const m = right.length
  const width = m + 1
  const table = new Uint32Array((n + 1) * width)
  const lcs = (i: number, j: number): number => table[i * width + j] as number

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--)
      table[i * width + j] = left[i] === right[j] ? lcs(i + 1, j + 1) + 1 : Math.max(lcs(i + 1, j), lcs(i, j + 1))
  }

  const hunks: DiffHunk[] = []
  let i = 0
  let j = 0

  while (i < n || j < m) {
    if (i < n && j < m && left[i] === right[j]) {
      i++
      j++

      continue
    }

    const aStart = i
    const bStart = j

    while (i < n || j < m) {
      if (i < n && j < m && left[i] === right[j])
        break

      if (i >= n)
        j++
      else if (j >= m)
        i++
      else if (lcs(i + 1, j) >= lcs(i, j + 1))
        i++
      else
        j++
    }

    hunks.push({ aStart, aEnd: i, bStart, bEnd: j })
  }

  return hunks
}

/**
 * A word-level diff expressed as character spans over `source`, each safe to apply on its own.
 *
 * Applying every edit to `source`, right to left, reproduces `corrected`. An insertion is anchored
 * on a neighbouring word so no edit is ever zero-length, and a deletion swallows the space before
 * it so applying one does not leave a double space behind.
 */
export function diffWords(source: string, corrected: string): TextEdit[] {
  const a = tokenizeWords(source)
  const b = tokenizeWords(corrected)

  // With no word to anchor on, the only edit that can carry the text is one over the whole source.
  if (!a.length)
    return b.length ? [{ offset: 0, length: source.length, replacement: corrected }] : []

  const edits: TextEdit[] = []

  for (const hunk of diffTokens(a, b)) {
    const replacement = b.slice(hunk.bStart, hunk.bEnd).map(token => token.text).join(' ')

    if (hunk.aStart === hunk.aEnd) {
      const following = a[hunk.aStart]
      const anchor = following ?? a[hunk.aStart - 1]

      if (!anchor)
        continue

      edits.push({
        offset: anchor.offset,
        length: anchor.text.length,
        replacement: anchor === following ? `${replacement} ${anchor.text}` : `${anchor.text} ${replacement}`,
      })

      continue
    }

    const first = a[hunk.aStart]
    const last = a[hunk.aEnd - 1]

    if (!first || !last)
      continue

    if (hunk.bStart === hunk.bEnd) {
      const previous = a[hunk.aStart - 1]
      const start = previous ? previous.offset + previous.text.length : first.offset

      edits.push({ offset: start, length: last.offset + last.text.length - start, replacement: '' })

      continue
    }

    edits.push({ offset: first.offset, length: last.offset + last.text.length - first.offset, replacement })
  }

  return edits
}

/** Runs of lines that differ, as index ranges over each side's [tokenizeLines] spans. */
export function diffLines(before: string, after: string): DiffHunk[] {
  return diffTokens(tokenizeLines(before), tokenizeLines(after))
}
