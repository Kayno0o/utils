import { parseArgs } from '~/cli'

const result = parseArgs({
  args: process.argv.splice(2),
  help: {
    name: 'cli',
    shortDescription: 'Parse cli arguments',
    footerBlocks: [{ title: 'Credits', content: ['Author: Kayno0o', 'License: MIT'] }],
    keywords: ['command', 'option'],
  },
  options: {
    ts: {
      type: 'boolean',
      required: true,
      description: 'Set language to TypeScript',
      alias: 'typescript',
    },
    file: {
      type: 'path',
      default: './.env',
      short: 'f',
      description: 'Path of file to read',
    },
    day: {
      type: 'date',
      default: (new Date()).toLocaleDateString(),
      short: 'd',
    },
    nb: {
      format: (value: string) => String(Number(value) + 10),
      required: true,
      default: 123,
      alias: 'number-dir',
    },
  },
})

console.log(result)
