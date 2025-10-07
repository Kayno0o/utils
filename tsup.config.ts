import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    './src/index.ts',
    './src/cli.ts',
    './src/*/index.ts',
    './src/i18n/date/*.ts',
  ],
  format: ['esm'],
  minify: true,
  sourcemap: false,
  splitting: false,
  treeshake: true,
  tsconfig: './tsconfig.json',
})
