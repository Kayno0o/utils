function escapeField(value: unknown, sep: string): string {
  const s = String(value ?? '')

  return s.includes('"') || s.includes(sep) || s.includes('\n') ? `"${s.replaceAll('"', '""')}"` : s
}

export function parseCsv<T extends Record<string, string>>(str: string, { separator = ',' }: { separator?: string } = {}): T[] {
  const rows: string[][] = []
  let cur = ''
  let inQuotes = false
  let row: string[] = []
  const s = str.includes('\r') ? str.replace(/\r\n?/g, '\n') : str
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
      i++
    }
    else if (s.startsWith(separator, i)) {
      row.push(cur)
      cur = ''
      i += separator.length
    }
    else {
      row.push(cur)
      cur = ''

      if (row.some(f => f.length))
        rows.push(row)

      row = []
      i++
    }
  }

  row.push(cur)

  if (row.some(f => f.length))
    rows.push(row)

  if (rows.length < 2)
    return []

  const headers = rows[0]!
  const result: T[] = []

  for (let r = 1; r < rows.length; r++) {
    const record: Record<string, string> = {}

    for (const [h, header] of headers.entries())
      record[header] = rows[r]![h] ?? ''

    result.push(record as T)
  }

  return result
}

export function stringifyCsv(rows: Record<string, unknown>[], { separator = ',', headers }: { separator?: string, headers?: string[] } = {}): string {
  if (!rows.length)
    return headers ? headers.join(separator) : ''

  const keys = headers ?? Object.keys(rows[0]!)

  return [keys.join(separator), ...rows.map(row => keys.map(k => escapeField(row[k], separator)).join(separator))].join('\n')
}
