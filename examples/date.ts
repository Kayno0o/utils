import dayjs from 'dayjs'
import { calculateEaster, configureDayjs, formatDate, getFrenchHolidays } from '../index'

configureDayjs(dayjs)

console.log(formatDate(dayjs, calculateEaster(2025)))
console.log(getFrenchHolidays(2025).includes('2025-04-21'))
