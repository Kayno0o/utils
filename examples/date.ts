import { buildDate, loadDateLocale } from '../src/builders/date'
import fr from '../src/i18n/date/fr'

console.log(buildDate())
console.log(buildDate('2025-06-06'))
console.log(buildDate('25-06-06'))
console.log(buildDate('06/10/2025', {}))
console.log(buildDate({ build: ({ year, month, day }) => `${year}-${month}-${day}` }))
console.log(buildDate({ format: 'iso' }))
console.log(buildDate({ format: 'YMD' }))
console.log(buildDate('D-M-Y'))
console.log(buildDate('W'))
console.log(buildDate('d www'))

loadDateLocale(fr)
console.log(buildDate('d www'))
console.log(buildDate('wwww d mmmm'))
