export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}
