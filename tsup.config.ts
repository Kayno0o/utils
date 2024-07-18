import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true, // Generate declaration file (.d.ts)
  entry: ['./index.ts'],
  format: ['cjs', 'esm'], // Build for commonJS and ESmodules
  minify: true,
  sourcemap: true,
  splitting: false,
  target: ['chrome80', 'firefox80', 'node18'],
})
