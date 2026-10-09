import { colors, createColors } from '../src/tools/colors'

console.log(colors.red.rgb(255, 255, 255, 'bg')('red text with white background'))
console.log(colors.ansi256(202)('red text'))

const errorColors = createColors({ stream: process.stderr })

console.error(errorColors.bold.red('escapes only when stderr is a TTY'))
