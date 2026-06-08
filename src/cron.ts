const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const MONTH_ALIASES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

const DAY_ALIASES: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

interface CronField {
  /** The raw field token, e.g. `*\/5` or `0,30`. */
  raw: string
  /** Every allowed value for the field. */
  values: Set<number>
  /** Whether the field is restricted (not a plain `*`). */
  restricted: boolean
}

export interface CronExplanation {
  /** The cron schedule portion of the input (the five time fields). */
  expression: string
  /** The command appended after the schedule, when present. */
  command?: string
  /** A human-readable summary of the schedule. */
  description: string
  /** The next execution dates, starting after `from`. */
  nextRuns: Date[]
}

export interface CronExpressionExplainerOptions {
  /** How many upcoming runs to compute. Defaults to `5`. */
  count?: number
  /** The reference date to compute runs from. Defaults to `new Date()`. */
  from?: Date
}

function parseField(raw: string, min: number, max: number, aliases?: Record<string, number>): CronField {
  const values = new Set<number>()
  const restricted = raw !== '*'

  const resolve = (token: string): number => {
    const alias = aliases?.[token.toLowerCase()]

    if (alias !== undefined)
      return alias

    const value = Number(token)

    if (!Number.isInteger(value) || value < min || value > max)
      throw new Error(`Invalid cron value "${token}" (expected ${min}-${max})`)

    return value
  }

  for (const part of raw.split(',')) {
    const [rangePart, stepPart] = part.split('/')
    const step = stepPart === undefined ? 1 : Number(stepPart)

    if (!Number.isInteger(step) || step < 1)
      throw new Error(`Invalid cron step "${stepPart}"`)

    let start = min
    let end = max

    if (rangePart !== '*' && rangePart !== '') {
      const [from, to] = rangePart!.split('-')

      start = resolve(from!)
      end = to === undefined ? (stepPart === undefined ? start : max) : resolve(to)
    }

    for (let value = start; value <= end; value += step)
      values.add(value)
  }

  return { raw, values, restricted }
}

function parseExpression(expression: string): {
  minute: CronField
  hour: CronField
  dayOfMonth: CronField
  month: CronField
  dayOfWeek: CronField
} {
  const fields = expression.trim().split(/\s+/)

  if (fields.length !== 5)
    throw new Error(`Invalid cron expression: expected 5 fields, got ${fields.length}`)

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields as [string, string, string, string, string]

  const dow = parseField(dayOfWeek, 0, 7, DAY_ALIASES)

  // 7 and 0 both represent Sunday; normalise to 0.
  if (dow.values.delete(7))
    dow.values.add(0)

  return {
    minute: parseField(minute, 0, 59),
    hour: parseField(hour, 0, 23),
    dayOfMonth: parseField(dayOfMonth, 1, 31),
    month: parseField(month, 1, 12, MONTH_ALIASES),
    dayOfWeek: dow,
  }
}

function dayMatches(date: Date, dayOfMonth: CronField, dayOfWeek: CronField): boolean {
  const domMatch = dayOfMonth.values.has(date.getDate())
  const dowMatch = dayOfWeek.values.has(date.getDay())

  // Vixie cron: when both day fields are restricted, either may match.
  if (dayOfMonth.restricted && dayOfWeek.restricted)
    return domMatch || dowMatch

  if (dayOfMonth.restricted)
    return domMatch

  if (dayOfWeek.restricted)
    return dowMatch

  return true
}

function computeNextRuns(fields: ReturnType<typeof parseExpression>, from: Date, count: number): Date[] {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = fields
  const runs: Date[] = []

  // Start at the next whole minute after `from`.
  const date = new Date(from)

  date.setSeconds(0, 0)
  date.setMinutes(date.getMinutes() + 1)

  // Safety bound: stop searching beyond ~8 years to avoid infinite loops on
  // impossible expressions (e.g. Feb 30th).
  const limit = new Date(date)

  limit.setFullYear(limit.getFullYear() + 8)

  while (runs.length < count) {
    if (date > limit)
      break

    if (!month.values.has(date.getMonth() + 1)) {
      date.setMonth(date.getMonth() + 1, 1)
      date.setHours(0, 0, 0, 0)

      continue
    }

    if (!dayMatches(date, dayOfMonth, dayOfWeek)) {
      date.setDate(date.getDate() + 1)
      date.setHours(0, 0, 0, 0)

      continue
    }

    if (!hour.values.has(date.getHours())) {
      date.setHours(date.getHours() + 1, 0, 0, 0)

      continue
    }

    if (!minute.values.has(date.getMinutes())) {
      date.setMinutes(date.getMinutes() + 1, 0, 0)

      continue
    }

    runs.push(new Date(date))
    date.setMinutes(date.getMinutes() + 1)
  }

  return runs
}

function humanizeList(field: CronField, name?: (value: number) => string, aliases?: Record<string, number>): string {
  const format = name ?? String
  const resolve = (token: string): string => {
    const alias = aliases?.[token.toLowerCase()]

    return format(alias ?? Number(token))
  }

  const stepMatch = (/^(\*|\d+(?:-\d+)?)\/(\d+)$/).exec(field.raw)

  if (stepMatch) {
    const [, range, step] = stepMatch

    if (range === '*')
      return `every ${step}`

    return `every ${step} from ${range!.replace('-', ' through ')}`
  }

  const parts = field.raw.split(',').map((part) => {
    if (part.includes('-')) {
      const [from, to] = part.split('-')

      return `${resolve(from!)} through ${resolve(to!)}`
    }

    return resolve(part)
  })

  if (parts.length === 1)
    return parts[0]!

  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
}

function describe(fields: ReturnType<typeof parseExpression>): string {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = fields
  const parts: string[] = []

  if (minute.restricted)
    parts.push((/\//).test(minute.raw) ? `${humanizeList(minute)} minutes` : `minute ${humanizeList(minute)}`)

  if (hour.restricted)
    parts.push((/\//).test(hour.raw) ? `${humanizeList(hour)} hours` : `at hour ${humanizeList(hour)}`)

  if (dayOfMonth.restricted)
    parts.push(`on day ${humanizeList(dayOfMonth)} of the month`)

  if (month.restricted)
    parts.push(`in ${humanizeList(month, value => MONTH_NAMES[value - 1]!, MONTH_ALIASES)}`)

  if (dayOfWeek.restricted)
    parts.push(`on ${humanizeList(dayOfWeek, value => DAY_NAMES[value % 7]!, DAY_ALIASES)}`)

  if (parts.length === 0)
    return 'Every minute'

  const sentence = parts.join(', ')

  return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}

/**
 * Explain a cron expression in plain language and compute its upcoming runs.
 *
 * Accepts a standard 5-field cron expression (`minute hour day-of-month month
 * day-of-week`), optionally followed by a command. Supports `*`, lists (`1,2,3`),
 * ranges (`1-5`), steps (`*\/5`, `0-30/10`) and month/weekday aliases
 * (`jan`, `mon`, …). Day-of-week accepts both `0` and `7` for Sunday.
 *
 * @param input - A cron expression, optionally followed by a command to run.
 * @param options - Controls how many runs to compute and the reference date.
 * @returns The parsed schedule, optional command, description and next runs.
 *
 * @example
 * ```ts
 * cronExpressionExplainer('0 * * * 0 /bin/bash')
 * // {
 * //   expression: '0 * * * 0',
 * //   command: '/bin/bash',
 * //   description: 'Minute 0, on Sunday',
 * //   nextRuns: [Date, Date, Date, Date, Date],
 * // }
 * ```
 */
export function cronExpressionExplainer(input: string, options: CronExpressionExplainerOptions = {}): CronExplanation {
  const { count = 5, from = new Date() } = options

  const tokens = input.trim().split(/\s+/)

  if (tokens.length < 5)
    throw new Error(`Invalid cron expression: expected at least 5 fields, got ${tokens.length}`)

  const expression = tokens.slice(0, 5).join(' ')
  const command = tokens.length > 5 ? tokens.slice(5).join(' ') : undefined

  const fields = parseExpression(expression)
  const description = command ? `${describe(fields)}, running \`${command}\`` : describe(fields)
  const nextRuns = computeNextRuns(fields, from, count)

  return { expression, command, description, nextRuns }
}
