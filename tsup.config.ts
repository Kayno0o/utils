import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['./index.ts', './i18n/date/*.ts'],
  format: ['cjs', 'esm'],
  minify: true,
  sourcemap: false,
  splitting: false,
})
