function escapeField(value: unknown, sep: string): string {
  const s = String(value ?? '').replace(/"/g, '""')

  return s.includes('"') || s.includes(sep) || s.includes('\n') ? `"${s}"` : s
}

/** @deprecated use `parseCsv` */
export const csvParse = parseCsv
export function parseCsv<T extends Record<string, string>>(str: string, { separator = ',' }: { separator?: string } = {}): T[] {
  const rows: string[][] = []
  let cur = ''
  let inQuotes = false
  let row: string[] = []
  const s = str.replace(/\r\n?/g, '\n')

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!

    if (inQuotes) {
      if (ch === '"' && s[i + 1] === '"') {
        cur += '"'
        i++
      }
      else if (ch === '"') {
        inQuotes = false
      }
      else { cur += ch }
    }
    else if (ch === '"') {
      inQuotes = true
    }
    else if (s.startsWith(separator, i)) {
      row.push(cur)
      cur = ''
      i += separator.length - 1
    }
    else if (ch === '\n') {
      row.push(cur)
      cur = ''

      if (row.some(f => f.length))
        rows.push(row)

      row = []
    }
    else { cur += ch }
  }

  row.push(cur)

  if (row.some(f => f.length))
    rows.push(row)

  if (rows.length < 2)
    return []

  const headers = rows[0]!

  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])) as T)
}

/** @deprecated use `stringifyCsv` */
export const csvStringify = stringifyCsv
export function stringifyCsv(rows: Record<string, unknown>[], { separator = ',', headers }: { separator?: string, headers?: string[] } = {}): string {
  if (!rows.length)
    return ''

  const keys = headers ?? Object.keys(rows[0]!)

  return [keys.join(separator), ...rows.map(row => keys.map(k => escapeField(row[k], separator)).join(separator))].join('\n')
}
