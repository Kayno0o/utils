import { getDaysInMonth } from './dateUtils'

export function fakeYear({
  endYear = new Date().getFullYear() + 4,
  startYear = new Date().getFullYear() - 4,
}: {
  endYear?: number
  startYear?: number
} = {}): string {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
  return year.toString()
}

export function fakeMonth(): string {
  const month = Math.floor(Math.random() * 12) + 1
  return month.toString().padStart(2, '0')
}

export function fakeDate({
  endYear = new Date().getFullYear() + 4,
  startYear = new Date().getFullYear() - 4,
}: {
  endYear?: number
  startYear?: number
} = {}): string {
  const year = Number(fakeYear({ endYear, startYear }))
  const month = Number(fakeMonth())
  const daysInMonth = getDaysInMonth(year, month)

  const day = Math.floor(Math.random() * daysInMonth) + 1
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}
