import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['./index.ts'],
  format: ['cjs', 'esm'],
  minify: true,
  sourcemap: false,
  splitting: false,
})
