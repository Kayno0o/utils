import type { VCardContact } from '../src/vcard'
import { describe, expect, it } from 'bun:test'
import { generateVCard, normalizePhone, parseVCards } from '../src/vcard'

describe('normalizePhone', () => {
  it('strips non-digit characters', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('15551234567')
  })

  it('leaves digits unchanged', () => {
    expect(normalizePhone('0612345678')).toBe('0612345678')
  })
})

describe('parseVCards', () => {
  const raw = `BEGIN:VCARD
VERSION:3.0
N:Doe;John;;;
FN:John Doe
TEL:+33600000001
EMAIL:john@example.com
BDAY:19900315
NOTE:Hello\\nWorld
END:VCARD`

  it('parses given and family name from N field', () => {
    const [c] = parseVCards(raw)

    expect(c?.given_name).toBe('John')
    expect(c?.family_name).toBe('Doe')
  })

  it('parses phone and email', () => {
    const [c] = parseVCards(raw)

    expect(c?.contact_phone).toBe('+33600000001')
    expect(c?.contact_email).toBe('john@example.com')
  })

  it('parses birthday', () => {
    const [c] = parseVCards(raw)

    expect(c?.birth_year).toBe(1990)
    expect(c?.birth_month).toBe(3)
    expect(c?.birth_day).toBe(15)
  })

  it('unescapes note newlines', () => {
    const [c] = parseVCards(raw)

    expect(c?.notes).toBe('Hello\nWorld')
  })

  it('parses multiple vcards', () => {
    const multi = `${raw}\n${raw.replace('John', 'Jane').replace('john', 'jane')}`
    const contacts = parseVCards(multi)

    expect(contacts).toHaveLength(2)
  })

  it('falls back to FN when N is absent', () => {
    const vc = `BEGIN:VCARD\nVERSION:3.0\nFN:Alice Smith\nEND:VCARD`
    const [c] = parseVCards(vc)

    expect(c?.given_name).toBe('Alice')
    expect(c?.family_name).toBe('Smith')
  })
})

describe('generateVCard', () => {
  const contact: VCardContact = {
    given_name: 'John',
    family_name: 'Doe',
    contact_phone: '+33600000001',
    contact_email: 'john@example.com',
    birth_year: 1990,
    birth_month: 3,
    birth_day: 15,
    notes: 'Hello\nWorld',
  }

  it('starts and ends with VCARD markers', () => {
    const v = generateVCard(contact)

    expect(v).toMatch(/^BEGIN:VCARD/)
    expect(v).toMatch(/END:VCARD$/)
  })

  it('round-trips through parseVCards', () => {
    const v = generateVCard(contact)
    const [parsed] = parseVCards(v)

    expect(parsed?.given_name).toBe('John')
    expect(parsed?.family_name).toBe('Doe')
    expect(parsed?.birth_year).toBe(1990)
    expect(parsed?.birth_month).toBe(3)
    expect(parsed?.birth_day).toBe(15)
  })

  it('encodes note newlines as \\n', () => {
    const v = generateVCard(contact)

    expect(v).toContain('NOTE:Hello\\nWorld')
  })
})
