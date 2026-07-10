import typescript from '@kaynooo/eslint/typescript'

export default typescript({
  mergeOptions: {
    ignores: ['./README.md', './TODO.md', './CLAUDE.md'],
  },
})
