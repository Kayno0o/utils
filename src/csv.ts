function escapeField(value: unknown, sep: string): string {
  const s = String(value ?? '').replace(/"/g, '""')

  return s.includes('"') || s.includes(sep) || s.includes('\n') ? `"${s}"` : s
}

// ponytail: does not handle multi-line quoted fields; add RFC 4180 parser if needed
function parseRow(line: string, sep: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!

    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      }
      else if (ch === '"') {
        inQuotes = false
      }
      else {
        cur += ch
      }
    }
    else if (ch === '"') {
      inQuotes = true
    }
    else if (line.startsWith(sep, i)) {
      result.push(cur)
      cur = ''
      i += sep.length - 1
    }
    else {
      cur += ch
    }
  }

  result.push(cur)

  return result
}

export function csvParse<T extends Record<string, string>>(str: string, { separator = ',' }: { separator?: string } = {}): T[] {
  const lines = str.replace(/\r\n?/g, '\n').split('\n').filter(line => line.length)

  if (lines.length < 2)
    return []

  const headers = parseRow(lines[0]!, separator)

  return lines.slice(1).map(line => Object.fromEntries(headers.map((h, i) => [h, parseRow(line, separator)[i] ?? ''])) as T)
}

export function csvStringify(rows: Record<string, unknown>[], { separator = ',', headers }: { separator?: string, headers?: string[] } = {}): string {
  if (!rows.length)
    return ''

  const keys = headers ?? Object.keys(rows[0]!)

  return [keys.join(separator), ...rows.map(row => keys.map(k => escapeField(row[k], separator)).join(separator))].join('\n')
}
