import { Glob } from 'bun'
import pkg from '../package.json'

const entrypoints = [...new Glob('src/**/*.ts').scanSync('.')]
  .filter(file => !file.endsWith('.test.ts') && !file.endsWith('.d.ts'))

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]

const result = await Bun.build({
  entrypoints,
  outdir: 'dist',
  root: 'src',
  target: 'node',
  format: 'esm',
  splitting: true,
  minify: true,
  external,
})

if (!result.success) {
  for (const log of result.logs)
    console.error(log)
  process.exit(1)
}
