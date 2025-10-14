import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/cli.ts',
    './src/*/index.ts',
    './src/i18n/date/*.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: true,
  treeshake: true,
})
