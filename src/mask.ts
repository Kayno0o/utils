const WHITESPACE_CHAR_GLOBAL_REGEX = /\s/g
const WHITESPACE_CHAR_REGEX = /\s/
const PHONE_PREFIX_REGEX = /^\+\d{1,3}/
const NON_DIGIT_GLOBAL_REGEX = /\D/g
const DIGIT_GLOBAL_REGEX = /\d/g
const TOKEN_PREFIX_REGEX = /^(?:gh[pousr]_|github_pat_|glpat-|gldt-)/
const COLON_DASH_REGEX = /[:-]/
const HEX_GROUP_REGEX = /^[0-9a-f]{1,4}$/i
const NEWLINE_REGEX = /\r?\n/

export type MaskKey = 'creditCard' | 'custom' | 'dbUrl' | 'email' | 'gitToken' | 'iban' | 'ip' | 'mac' | 'pem' | 'phone' | 'token' | 'url'

export interface MaskCustomRule {
  pattern: RegExp
  replacer: (match: string) => string
}

export interface MaskRange {
  end: number
  key: MaskKey
  /** only present when `keepOriginals: true` */
  original?: string
  start: number
}

export interface MaskOptions {
  creditCard?: boolean
  custom?: MaskCustomRule[]
  dbUrl?: boolean
  email?: boolean
  gitToken?: boolean
  iban?: boolean
  ip?: boolean
  /**
   * keep the original matched text in `ranges[].original`.
   * defaults to `false` because the masked result should not carry the raw secrets.
   */
  keepOriginals?: boolean
  mac?: boolean
  mode?: 'mask' | 'redact'
  pem?: boolean
  phone?: boolean
  replace?: string
  token?: boolean
  url?: boolean
}

export interface MaskResult {
  hits: Record<MaskKey, number>
  ranges: MaskRange[]
  result: string
}

const EMAIL_RE = /[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
// ponytail: matches French-style 10-digit phones; extend regex for other formats
const PHONE_RE = /\b(?:\+\d{1,3}\s?)?0\d(?:[\s\-.]?\d{2}){4}\b/g
const IPV4_RE = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g
// anything colon-dense that could be an IPv6 address (≥2 colons, optional IPv4 tail, optional zone)
const IPV6_RE = /(?<![\w.:])(?=[0-9a-f:]*:[0-9a-f:]*:)[0-9a-f:]{2,45}(?:(?:\d{1,3}\.){3}\d{1,3})?(?:%[0-9a-z]+)?(?![\w.:])/gi
const IPV4_TAIL_RE = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/
const IBAN_RE = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/g
const CREDIT_CARD_RE = /\b(?:\d{4}[\s-]?){3}\d{4}\b/g
const BEARER_RE = /\bBearer\s+\S+/gi
const JWT_RE = /\beyJ[\w-]+\.[\w-]+\.[\w-]*/g
// only mask query parameters that commonly carry secrets
const URL_QUERY_RE = /([?&](?:token|key|api[_-]?key|secret|password|auth|code|session)[^=&#\s]*)=([^&#\s]+)/gi
const GIT_TOKEN_RE = /\b(?:gh[pousr]_\w{36}|github_pat_\w+|glpat-[\w-]{20,})\b/gi
const MAC_RE = /\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/gi
const PEM_RE = /-----BEGIN [A-Z0-9 ]+-----[A-Za-z0-9+/=\s]+-----END [A-Z0-9 ]+-----/g
const DB_URL_RE = /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|sqlite|mssql|oracle):\/\/\S+/gi

function maskEmail(m: string, char: string): string {
  const [local, domain] = m.split('@')

  if (!local || !domain)
    return m

  const dot = domain.lastIndexOf('.')
  const maskedLocal = local.length <= 1 ? char.repeat(4) : `${local[0]}${char.repeat(3)}`

  return `${maskedLocal}@${domain[0]}${char.repeat(3)}${domain.slice(dot)}`
}

function maskPhone(m: string, char: string): string {
  const prefixMatch = m.match(PHONE_PREFIX_REGEX)
  const prefix = prefixMatch ? prefixMatch[0] : ''
  const body = prefix ? m.slice(prefix.length) : m
  const d = body.replace(NON_DIGIT_GLOBAL_REGEX, '')
  const groups = Math.max(0, Math.floor((d.length - 4) / 2))
  const masked = `${d.slice(0, 2)} ${`${char}${char} `.repeat(groups).trim()} ${d.slice(-2)}`

  return prefix ? `${prefix} ${masked}` : masked
}

function maskIp(m: string, char: string): string {
  if (m.includes(':')) {
    const segments = m.split(':')
    const first = segments.find(Boolean) ?? ''
    const last = [...segments].reverse().find(Boolean) ?? ''

    return `${first}:${char}:${last}`
  }

  const [a, b] = m.split('.')

  return `${a}.${b}.${char}.${char}`
}

function maskIban(m: string, char: string): string {
  const clean = m.replace(WHITESPACE_CHAR_GLOBAL_REGEX, '')
  const end = clean.length - 4
  let idx = 0

  return [...m].map(c => c === ' ' ? c : (i => i >= 4 && i < end ? char : c)(idx++)).join('')
}

function maskCreditCard(m: string, char: string): string {
  const digits = m.replace(NON_DIGIT_GLOBAL_REGEX, '')
  const masked = digits[0] + char.repeat(digits.length - 5) + digits.slice(-4)
  let i = 0

  return m.replace(DIGIT_GLOBAL_REGEX, () => masked[i++]!)
}

function maskJwt(m: string, char: string): string {
  const dot = m.indexOf('.')

  return `${m.slice(0, dot)}.${char.repeat(3)}.${char.repeat(3)}`
}

function maskBearer(m: string, char: string): string {
  const token = m.slice(m.search(WHITESPACE_CHAR_REGEX) + 1).trim()

  return `Bearer ${token.startsWith('eyJ') ? maskJwt(token, char) : char.repeat(3)}`
}

function maskUrlParam(m: string, char: string): string {
  const eq = m.indexOf('=')

  return `${m.slice(0, eq + 1)}${char.repeat(3)}`
}

function maskGitToken(m: string, char: string): string {
  const prefix = m.match(TOKEN_PREFIX_REGEX)?.[0] ?? m.slice(0, 7)

  return `${prefix}${char.repeat(3)}`
}

function maskMac(m: string, char: string): string {
  const groups = m.split(COLON_DASH_REGEX)

  return `${groups[0]}${char.repeat(2)} ${groups[2]}${char.repeat(2)} ${groups[4]}${char.repeat(2)}`
}

function maskPem(m: string, char: string): string {
  const lines = m.split('\n')

  return lines.map((line, i) => {
    return i === 0 || i === lines.length - 1 || line.trim() === '' ? line : char.repeat(line.length)
  }).join('\n')
}

function maskDbUrl(m: string, char: string): string {
  const at = m.indexOf('@')

  if (at === -1)
    return m

  const prefix = m.slice(0, at)
  const colon = prefix.lastIndexOf(':')

  return colon === -1 ? m : `${prefix.slice(0, colon + 1)}${char.repeat(3)}${m.slice(at)}`
}

/** Luhn checksum for 13-19 digit identifiers (credit cards, etc.) */
function luhnCheck(digits: string): boolean {
  let sum = 0
  let alternate = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number.parseInt(digits[i]!, 10)

    if (alternate) {
      n *= 2

      if (n > 9)
        n -= 9
    }

    sum += n
    alternate = !alternate
  }

  return sum % 10 === 0
}

function isValidIpv6(s: string): boolean {
  const [addr] = s.split('%')
  const halves = addr!.split('::')

  if (halves.length > 2)
    return false // more than one "::"

  const toGroups = (side: string) => side === '' ? [] : side.split(':')
  const groups = [...toGroups(halves[0]!), ...toGroups(halves[1] ?? '')]
  let count = 0

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]!

    if (g.includes('.')) {
      if (i !== groups.length - 1 || !IPV4_TAIL_RE.test(g))
        return false

      count += 2 // embedded IPv4 = two 16-bit groups
    }
    else {
      if (!HEX_GROUP_REGEX.test(g))
        return false

      count += 1
    }
  }

  return halves.length === 2 ? count < 8 : count === 8
}

/** ISO 13616 mod-97 IBAN validation */
function ibanCheck(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const numeric = [...rearranged].map((c) => {
    const code = c.toUpperCase().charCodeAt(0)

    return code >= 65 && code <= 90 ? String(code - 55) : c
  }).join('')
  let remainder = numeric

  while (remainder.length > 2) {
    const block = remainder.slice(0, 9)

    remainder = (Number.parseInt(block, 10) % 97) + remainder.slice(9)
  }

  return Number.parseInt(remainder, 10) % 97 === 1
}

interface MaskMatch {
  end: number
  key: MaskKey
  original: string
  priority: number
  replacement: string
  start: number
}

/**
 * push all matches for a detector against the original string onto `out`.
 * returning `null` from the replacer drops the match (used for checksum validation).
 */
function collect(out: MaskMatch[], str: string, re: RegExp, replacer: (match: string) => string | null, key: MaskKey, priority: number): void {
  for (const m of str.matchAll(re)) {
    const replacement = replacer(m[0])

    if (replacement === null)
      continue

    out.push({
      start: m.index!,
      end: m.index! + m[0].length,
      key,
      original: m[0],
      priority,
      replacement,
    })
  }
}

/** drop overlapping matches; higher priority wins, first wins on ties */
function resolveOverlaps(matches: MaskMatch[]): MaskMatch[] {
  matches.sort((a, b) => a.start - b.start)

  const kept: MaskMatch[] = []

  for (const m of matches) {
    // kept is sorted and disjoint, so only its tail can reach back over m
    let tailStart = kept.length

    while (tailStart > 0 && kept[tailStart - 1]!.end > m.start)
      tailStart--

    let blocked = false

    for (let i = tailStart; i < kept.length; i++) {
      const k = kept[i]!

      if (k.start < m.end && k.priority >= m.priority) {
        blocked = true

        break
      }
    }

    if (blocked)
      continue

    let write = tailStart

    for (let i = tailStart; i < kept.length; i++) {
      const k = kept[i]!

      if (k.start >= m.end)
        kept[write++] = k
    }

    kept.length = write
    kept.push(m)
  }

  return kept
}

export function mask(str: string, {
  creditCard = true,
  custom,
  dbUrl = true,
  email = true,
  gitToken = true,
  iban = true,
  ip = true,
  keepOriginals = false,
  mac = true,
  mode = 'mask',
  pem = true,
  phone = true,
  replace: char = '*',
  token = true,
  url = true,
}: MaskOptions = {}): MaskResult {
  if (custom) {
    for (const { pattern } of custom) {
      if (!pattern.global) {
        throw new TypeError(
          `custom pattern ${pattern} must use the 'g' flag`,
        )
      }
    }
  }

  const hits: Record<MaskKey, number> = { creditCard: 0, custom: 0, dbUrl: 0, email: 0, gitToken: 0, iban: 0, ip: 0, mac: 0, pem: 0, phone: 0, token: 0, url: 0 }

  const applyMode = (fn: (m: string) => string | null) =>
    mode === 'redact' ? () => '[REDACTED]' : fn

  const matches: MaskMatch[] = []

  if (email)
    collect(matches, str, EMAIL_RE, applyMode(m => maskEmail(m, char)), 'email', 10)

  if (phone)
    collect(matches, str, PHONE_RE, applyMode(m => maskPhone(m, char)), 'phone', 20)

  if (ip) {
    collect(matches, str, IPV4_RE, applyMode(m => maskIp(m, char)), 'ip', 30)
    collect(matches, str, IPV6_RE, applyMode(m => isValidIpv6(m) ? maskIp(m, char) : null), 'ip', 31)
  }

  if (mac)
    collect(matches, str, MAC_RE, applyMode(m => maskMac(m, char)), 'mac', 35)

  if (iban) {
    collect(matches, str, IBAN_RE, applyMode((m) => {
      return ibanCheck(m.replace(WHITESPACE_CHAR_GLOBAL_REGEX, '')) ? maskIban(m, char) : null
    }), 'iban', 40)
  }

  if (creditCard) {
    collect(matches, str, CREDIT_CARD_RE, applyMode((m) => {
      return luhnCheck(m.replace(NON_DIGIT_GLOBAL_REGEX, '')) ? maskCreditCard(m, char) : null
    }), 'creditCard', 50)
  }

  if (gitToken)
    collect(matches, str, GIT_TOKEN_RE, applyMode(m => maskGitToken(m, char)), 'gitToken', 55)

  if (token) {
    collect(matches, str, JWT_RE, applyMode(m => maskJwt(m, char)), 'token', 60)
    collect(matches, str, BEARER_RE, applyMode(m => maskBearer(m, char)), 'token', 70)
  }

  if (url)
    collect(matches, str, URL_QUERY_RE, applyMode(m => maskUrlParam(m, char)), 'url', 80)

  if (dbUrl)
    collect(matches, str, DB_URL_RE, applyMode(m => maskDbUrl(m, char)), 'dbUrl', 82)

  if (pem)
    collect(matches, str, PEM_RE, applyMode(m => maskPem(m, char)), 'pem', 85)

  if (custom) {
    for (const { pattern, replacer } of custom) {
      collect(matches, str, pattern, applyMode(m => replacer(m)), 'custom', 90)
    }
  }

  const kept = resolveOverlaps(matches)

  let result = ''
  let pos = 0
  const ranges: MaskRange[] = []

  for (const m of kept) {
    result += str.slice(pos, m.start)

    const start = result.length

    result += m.replacement

    ranges.push({
      start,
      end: result.length,
      key: m.key,
      ...(keepOriginals ? { original: m.original } : {}),
    })

    pos = m.end
    hits[m.key]++
  }

  result += str.slice(pos)

  return { hits, ranges, result }
}

export interface MaskEnvOptions extends MaskOptions {
  /** mask each value with `mask` instead of dropping it, so the file keeps its shape */
  maskValues?: boolean
}

export interface MaskEnvResult {
  keys: string[]
  result: string
}

const ENV_ASSIGN_RE = /^(\s*(?:export\s+)?)([A-Za-z_][\w.-]*)[ \t]*=(.*)$/
const ENV_COMMENT_RE = /^\s*#+/
const ENV_BLANK_RE = /^\s*$/

function envQuote(value: string): string {
  const first = value[0]

  return first === '"' || first === '\'' || first === '`' ? first : ''
}

/** the line a quoted value closes on, or -1 when it never closes and the value is the one line after all */
function envValueEnd(lines: string[], at: number, value: string, quote: string): number {
  if (value.includes(quote, 1))
    return at

  for (let next = at + 1; next < lines.length; next++) {
    if (lines[next]!.includes(quote))
      return next
  }

  return -1
}

/** a value `mask` recognises keeps its shape; anything else is a secret we know nothing about, so all of it goes */
function maskEnvValue(raw: string, options: MaskOptions, char: string): string {
  const quote = envQuote(raw)
  const quoted = Boolean(quote) && raw.length > 1 && raw.endsWith(quote)
  const inner = quoted ? raw.slice(1, -1) : raw

  if (!inner)
    return raw

  const { ranges, result } = mask(inner, options)
  const fallback = options.mode === 'redact' ? '[REDACTED]' : char.repeat(inner.length)
  const value = ranges.length ? result : fallback

  return quoted ? `${quote}${value}${quote}` : value
}

/**
 * strips a `.env` down to the keys it declares, keeping blank lines, comments and `export` prefixes.
 * `maskValues` keeps the values instead, run through `mask`. A commented-out assignment loses its value
 * like a live one, and a line that declares nothing at all is dropped rather than passed through.
 */
export function maskEnv(str: string, { maskValues = false, ...options }: MaskEnvOptions = {}): MaskEnvResult {
  const eol = str.includes('\r\n') ? '\r\n' : '\n'
  const lines = str.split(NEWLINE_REGEX)
  const char = options.replace ?? '*'
  const keys: string[] = []
  const out: string[] = []

  const declare = (found: RegExpExecArray, value: string) =>
    `${found[1]!}${found[2]!}=${maskValues ? maskEnvValue(value, options, char) : ''}`

  for (let at = 0; at < lines.length; at++) {
    const line = lines[at]!

    if (ENV_BLANK_RE.test(line)) {
      out.push(line)

      continue
    }

    const hashes = ENV_COMMENT_RE.exec(line)

    if (hashes) {
      const commented = ENV_ASSIGN_RE.exec(line.slice(hashes[0].length))

      out.push(commented ? `${hashes[0]}${declare(commented, commented[3]!.trimStart())}` : line)

      continue
    }

    const found = ENV_ASSIGN_RE.exec(line)

    // a line declaring nothing is malformed env, and echoing it would hand back whatever it holds
    if (!found)
      continue

    let value = found[3]!.trimStart()
    const quote = envQuote(value)
    const end = quote ? envValueEnd(lines, at, value, quote) : at

    // a quoted value runs to its closing quote, which for a PEM key or a JSON blob is lines further down
    if (end > at) {
      value = [value, ...lines.slice(at + 1, end + 1)].join(eol)
      at = end
    }

    keys.push(found[2]!)
    out.push(declare(found, value))
  }

  return { keys, result: out.join(eol) }
}
