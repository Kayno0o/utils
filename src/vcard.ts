const NON_DIGIT_RE = /\D/g
const LINE_BREAK_RE = /\r?\n/
const LEADING_SPACE_RE = /^\s/
const FIELD_PREFIX_RE = /^[^:]+:/
const FN_SPACE_RE = /\s+/
const BDAY_DASH_RE = /-/g
const NOTE_NL_RE = /\\n/g

export interface VCardContact {
  given_name: string
  family_name?: string
  birth_day?: number
  birth_month?: number
  birth_year?: number
  contact_phone?: string
  contact_email?: string
  contact_social?: string
  nicknames?: string
  notes?: string
}

export function normalizePhone(phone: string): string {
  return phone.replace(NON_DIGIT_RE, '')
}

export function parseVCards(text: string): Partial<VCardContact>[] {
  const blocks = text.split(/BEGIN:VCARD/i).slice(1)

  return blocks.flatMap((block) => {
    // Unfold RFC 2425 continuation lines
    const rawLines: string[] = []

    for (const line of block.split(LINE_BREAK_RE)) {
      if (LEADING_SPACE_RE.test(line) && rawLines.length > 0)
        rawLines[rawLines.length - 1] += line.trimStart()
      else
        rawLines.push(line.trim())
    }

    const get = (prefix: string) => {
      const re = new RegExp(`^${prefix}(;[^:]*)?:`, 'i')
      const found = rawLines.find(l => re.test(l))

      return found ? found.replace(FIELD_PREFIX_RE, '') : undefined
    }

    const getFirst = (...prefixes: string[]): string | undefined => {
      for (const p of prefixes) {
        const v = get(p)

        if (v)
          return v
      }

      return undefined
    }

    let given_name = ''
    let family_name: string | undefined

    const n = get('N')

    if (n) {
      const parts = n.split(';')

      family_name = parts[0]?.trim() || undefined
      given_name = parts[1]?.trim() || ''
    }

    if (!given_name) {
      const fn = get('FN')

      if (fn) {
        const parts = fn.trim().split(FN_SPACE_RE)

        given_name = parts[0]!

        if (parts.length > 1)
          family_name = parts.slice(1).join(' ')
      }
    }

    if (!given_name)
      return []

    let birth_day: number | undefined
    let birth_month: number | undefined
    let birth_year: number | undefined

    const bday = get('BDAY')

    if (bday) {
      const clean = bday.replace(BDAY_DASH_RE, '')
      const y = Number.parseInt(clean.slice(0, 4))
      const m = Number.parseInt(clean.slice(4, 6))
      const d = Number.parseInt(clean.slice(6, 8))

      if (!Number.isNaN(m) && m > 0)
        birth_month = m

      if (!Number.isNaN(d) && d > 0)
        birth_day = d

      if (!Number.isNaN(y) && y >= 1900 && y <= 2050)
        birth_year = y
    }

    const telLine = rawLines.find(l => (/^TEL/i).test(l))
    const contact_phone = telLine ? telLine.replace(FIELD_PREFIX_RE, '').trim() : undefined
    const contact_email = getFirst('EMAIL')?.trim()
    const contact_social = get('URL')?.trim()

    const nickname = get('NICKNAME')
    const nicknames = nickname ? nickname.split(',').map(s => s.trim()).filter(Boolean).join('\n') : ''

    const note = get('NOTE')
    const notes = note ? note.replace(NOTE_NL_RE, '\n').trim() : ''

    return [{ given_name, family_name, birth_day, birth_month, birth_year, contact_phone, contact_email, contact_social, nicknames, notes }]
  })
}

export function generateVCard(contact: VCardContact): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${contact.family_name ?? ''};${contact.given_name};;;`,
    `FN:${contact.given_name}${contact.family_name ? ` ${contact.family_name}` : ''}`,
  ]

  if (contact.contact_phone)
    lines.push(`TEL:${contact.contact_phone}`)

  if (contact.contact_email)
    lines.push(`EMAIL:${contact.contact_email}`)

  if (contact.contact_social)
    lines.push(`URL:${contact.contact_social}`)

  if (contact.birth_month && contact.birth_day) {
    const y = contact.birth_year ? String(contact.birth_year).padStart(4, '0') : '0000'
    const m = String(contact.birth_month).padStart(2, '0')
    const d = String(contact.birth_day).padStart(2, '0')

    lines.push(`BDAY:${y}${m}${d}`)
  }

  if (contact.nicknames)
    lines.push(`NICKNAME:${contact.nicknames.split('\n').map(s => s.trim()).filter(Boolean).join(',')}`)

  if (contact.notes)
    lines.push(`NOTE:${contact.notes.split('\n').map(s => s.trim()).filter(Boolean).join('\\n')}`)

  lines.push('END:VCARD')

  return lines.join('\n')
}

export function downloadVCard(contacts: VCardContact[], filename: string): void {
  const blob = new Blob([contacts.map(generateVCard).join('\n')], { type: 'text/vcard' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
