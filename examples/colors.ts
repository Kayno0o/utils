import { colors } from '~'

console.log(colors.red.rgb(255, 255, 255, 'bg')('red text with white background'))
console.log(colors.ansi256(202)('red text'))
