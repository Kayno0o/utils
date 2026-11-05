import { escapeCSV } from './text'

export interface ParseCsvOptions {
  separator?: string
  /** `true` reads them off the first row, `false` keys every row by column index, an array names the columns of every row. Defaults to true. */
  headers?: boolean | string[]
  /** Trims the whitespace around each field, keeping what a quoted field holds. Defaults to false. */
  trim?: boolean
  /** Drops lines whose fields are all empty. Defaults to true. */
  skipEmptyLines?: boolean
}

export interface StringifyCsvOptions {
  separator?: string
  headers?: string[]
  /** Line ending, `\r\n` for Excel or RFC 4180. Defaults to `\n`. */
  newline?: string
  /** Starts with a UTF-8 byte order mark, so Excel reads accents right. Defaults to false. */
  bom?: boolean
}

const LINE_BREAK_REGEX = /\r\n?/g
const BOM = '\uFEFF'

export function parseCsv<T extends Record<string, string>>(str: string, { separator = ',', headers = true, trim = false, skipEmptyLines = true }: ParseCsvOptions = {}): T[] {
  const rows: string[][] = []
  let cur = ''
  let inQuotes = false
  let row: string[] = []
  let quoteStart: number | undefined
  let quoteEnd: number | undefined

  const endField = (): void => {
    if (trim && quoteStart !== undefined)
      row.push(cur.slice(0, quoteStart).trimStart() + cur.slice(quoteStart, quoteEnd) + cur.slice(quoteEnd ?? cur.length).trimEnd())
    else
      row.push(trim ? cur.trim() : cur)

    cur = ''
    quoteStart = quoteEnd = undefined
  }

  // A trailing line break ends the last row, it does not start an empty one.
  const endRow = (last: boolean): void => {
    const emptyLine = row.length === 1 && !row[0]

    if (row.some(f => f.length) || (!skipEmptyLines && !(last && emptyLine)))
      rows.push(row)

    row = []
  }

  const unmarked = str.startsWith(BOM) ? str.slice(BOM.length) : str
  const s = unmarked.includes('\r') ? unmarked.replace(LINE_BREAK_REGEX, '\n') : unmarked
  const separatorCode = separator.charCodeAt(0)
  let i = 0

  while (i < s.length) {
    if (inQuotes) {
      const quote = s.indexOf('"', i)

      if (quote === -1) {
        cur += s.slice(i)

        break
      }

      cur += s.slice(i, quote)

      if (s[quote + 1] === '"') {
        cur += '"'
        i = quote + 2
      }
      else {
        inQuotes = false
        quoteEnd = cur.length
        i = quote + 1
      }

      continue
    }

    // plain text up to the next quote, separator or newline is copied whole
    let end = i

    while (end < s.length) {
      const code = s.charCodeAt(end)

      if (code === 34 || code === 10 || (code === separatorCode && s.startsWith(separator, end)))
        break

      end++
    }

    cur += s.slice(i, end)
    i = end

    if (i >= s.length)
      break

    if (s[i] === '"') {
      inQuotes = true
      quoteStart = cur.length
      i++
    }
    else if (s.startsWith(separator, i)) {
      endField()
      i += separator.length
    }
    else {
      endField()
      endRow(false)
      i++
    }
  }

  endField()
  endRow(true)

  let columns: string[] | undefined

  if (headers === true)
    columns = rows.shift()
  else if (headers && headers.length)
    columns = headers

  const result: T[] = []

  for (const values of rows) {
    const record: Record<string, string> = {}

    if (columns) {
      for (const [h, header] of columns.entries())
        record[header] = values[h] ?? ''
    }
    else {
      for (const [h, value] of values.entries())
        record[h] = value
    }

    result.push(record as T)
  }

  return result
}

export function stringifyCsv(rows: Record<string, unknown>[], { separator = ',', headers, newline = '\n', bom = false }: StringifyCsvOptions = {}): string {
  const keys = headers ?? (rows.length ? Object.keys(rows[0]!) : undefined)

  if (!keys)
    return ''

  const lines = [keys, ...rows.map(row => keys.map(k => row[k] ?? ''))]

  return (bom ? BOM : '') + lines.map(line => line.map(value => escapeCSV(String(value), separator)).join(separator)).join(newline)
}
