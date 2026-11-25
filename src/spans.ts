import { getOrCreateCapped } from './internal'

export interface TextSpan {
  text: string
  offset: number
}

const WORD_RE = /\S+/g

/** Every run of non-whitespace, with where it starts in `text`. */
export function tokenizeWords(text: string): TextSpan[] {
  return [...text.matchAll(WORD_RE)].map(match => ({ text: match[0], offset: match.index }))
}

/** Every line, blank ones included, with where it starts in `text`; the `\r` of a `\r\n` ending is left out of the line. A trailing newline ends the last line rather than starting an empty one. */
export function tokenizeLines(text: string): TextSpan[] {
  if (text === '')
    return []

  const spans: TextSpan[] = []
  let offset = 0

  const lines = text.split('\n')

  for (const [index, line] of lines.entries()) {
    // a \r right before a \n belongs to the line ending, so mixed endings compare equal
    spans.push({ text: index < lines.length - 1 && line.endsWith('\r') ? line.slice(0, -1) : line, offset })
    offset += line.length + 1
  }

  if (spans.length > 1 && spans.at(-1)!.text === '')
    spans.pop()

  return spans
}

const sentenceSegmenters = new Map<string, Intl.Segmenter>()

/** Sentences with where each starts, split by the locale's own rules rather than by punctuation. */
export function splitSentences(text: string, locale = 'en'): TextSpan[] {
  const segmenter = getOrCreateCapped(sentenceSegmenters, locale, () => new Intl.Segmenter(locale, { granularity: 'sentence' }))

  return [...segmenter.segment(text)].map(segment => ({ text: segment.segment, offset: segment.index }))
}

/**
 * Joins adjacent spans until each carries at least `minLength` non-whitespace characters.
 *
 * Spans must be contiguous, the way [splitSentences] returns them: merging concatenates their text
 * and keeps the first offset, so a gap between two spans would be lost.
 */
export function mergeSpans(spans: TextSpan[], minLength: number): TextSpan[] {
  const merged: TextSpan[] = []
  const parts: string[][] = []
  // trimmed length and trailing whitespace of the last merged span, kept as spans join so its text is never re-trimmed
  let trimmed = 0
  let trailing = 0

  const flush = () => {
    if (merged.length)
      merged.at(-1)!.text = parts.at(-1)!.join('')
  }

  for (const span of spans) {
    const core = span.text.trimEnd().length
    const spanTrimmed = span.text.trim().length

    if (merged.length && trimmed < minLength) {
      parts.at(-1)!.push(span.text)

      if (spanTrimmed > 0) {
        // the previous trailing whitespace and this span's leading whitespace are now interior
        trimmed = trimmed > 0 ? trimmed + trailing + core : spanTrimmed
        trailing = span.text.length - core
      }
      else {
        trailing += span.text.length
      }

      continue
    }

    flush()
    merged.push({ ...span })
    parts.push([span.text])
    trimmed = spanTrimmed
    trailing = spanTrimmed > 0 ? span.text.length - core : span.text.length
  }

  flush()

  return merged
}

/** A span's bounds with its surrounding whitespace excluded, or null when it holds none. */
export function trimSpan(span: TextSpan): [number, number] | null {
  const from = span.offset + (span.text.length - span.text.trimStart().length)
  const to = span.offset + span.text.trimEnd().length

  return to > from ? [from, to] : null
}

export interface Excerpt {
  text: string
  offset: number
  length: number
}

/**
 * A window of `text` around one span, for showing an error in context.
 *
 * `offset` indexes the excerpt rather than the source, and counts the ellipsis when one was added,
 * so `excerpt.text.slice(offset, offset + length)` is always the span itself.
 */
export function excerptAround(text: string, offset: number, length: number, { radius = 40, ellipsis = '...' } = {}): Excerpt {
  const start = Math.max(0, offset - radius)
  const end = Math.min(text.length, offset + length + radius)
  const prefix = start > 0 ? ellipsis : ''

  return {
    text: `${prefix}${text.slice(start, end)}${end < text.length ? ellipsis : ''}`,
    offset: prefix.length + (offset - start),
    length,
  }
}
