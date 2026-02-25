import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    './src/**/*.ts',
    '!./src/**/*.test.ts',
    '!./src/**/*.d.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: true,
  treeshake: true,
})
