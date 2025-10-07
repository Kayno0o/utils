import { toCamel, toConstant, toKebab, toPascal, toSnake, toTitle } from '../src'

console.log(toPascal('pascalCase')) // PascalCase
console.log(toCamel('camel-case')) // camelCase
console.log(toConstant('contant_case')) // CONTANT_CASE
console.log(toTitle('TitleCase')) // Title Case
console.log(toKebab('Kebab Case')) // kebab-case
console.log(toSnake('SNAKE_CASE')) // snake_case
