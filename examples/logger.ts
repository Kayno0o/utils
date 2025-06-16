import { colors, declareCustomLogger, declareLogger } from '../index'

const baseLogger = declareLogger({ logLevel: 2 })
baseLogger('success', 'messages')
baseLogger('info', 'not logged')

const customLogger = declareCustomLogger({
  logTypes: {
    command: {
      char: '$',
      color: colors.gray,
      level: 2,
    },
    twig: {
      char: '%',
    },
  },
  logLevel: 2,
})

customLogger('command', 'bun run main.ts')
customLogger('twig', 'my twig template is initialized')
