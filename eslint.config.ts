import { defineConfig } from '@kaynooo/eslint'

export default defineConfig({
  // Rules @kaynooo/eslint 7 added over 3, which the code has yet to follow.
  overrides: {
    rules: {
      'e18e/prefer-slice-over-split-index': 'off',
      'e18e/prefer-static-regex': 'off',
      'no-nested-ternary': 'off',
      'ts/no-explicit-any': 'off',
    },
  },
}, { ignores: ['README.md', 'TODO.md', 'CLAUDE.md'] })
