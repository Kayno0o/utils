import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['./index.ts', './types'],
  format: ['cjs', 'esm'],
  minify: true,
  sourcemap: true,
  splitting: false,
  external: ['dayjs', 'ansi-colors'],
})
