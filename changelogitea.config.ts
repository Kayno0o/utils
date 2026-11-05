import { defineConfig } from '@kaynooo/changelogitea'

export default defineConfig({
  baseUrl: 'git.kaynooo.fr',
  rollup: { minor: true },
  highlights: { file: 'MIGRATION.md', url: 'https://git.kaynooo.fr/kaynooo/utils/src/branch/main/MIGRATION.md' },
})
