import { UnitConverter } from '../src/tools'

console.log(UnitConverter.from('byte', 'kB', 2040).to('MB'))
console.log(UnitConverter.from('speed', 'm/s', 76).to('km/h'))
