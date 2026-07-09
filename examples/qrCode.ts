import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { qrCodeSvg } from '../src/tools'

const outDir = join(import.meta.dir, 'output', 'qrcodes')

await mkdir(outDir, { recursive: true })

const url = 'https://github.com/Kayno0o/utils'

const codes: Record<string, string> = {
  'basic': qrCodeSvg(url, { title: 'utils repository' }),
  'rounded': qrCodeSvg(url, { moduleShape: 'rounded', eyeShape: 'rounded', title: 'utils repository' }),
  'dots': qrCodeSvg(url, { moduleShape: 'dot', eyeShape: 'circle' }),
  'gradient': qrCodeSvg(url, {
    moduleShape: 'rounded',
    eyeShape: 'rounded',
    foreground: { type: 'linear', rotation: 45, stops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#ec4899' }] },
  }),
  'dark': qrCodeSvg(url, {
    moduleShape: 'rounded',
    eyeShape: 'rounded',
    background: '#0f172a',
    foreground: '#38bdf8',
    eyeColor: '#f8fafc',
  }),
  'logo': qrCodeSvg(url, {
    moduleShape: 'rounded',
    eyeShape: 'rounded',
    logo: { href: 'https://avatars.githubusercontent.com/u/Kayno0o', size: 0.22, borderRadius: 2 },
  }),
  'gapped': qrCodeSvg(url, { moduleShape: 'dot', moduleScale: 0.7, eyeShape: 'circle' }),
  'per-eye': qrCodeSvg(url, {
    moduleShape: 'rounded',
    moduleScale: 0.85,
    foreground: '#334155',
    eyes: [
      { shape: 'rounded', color: '#ef4444' },
      { shape: 'circle', color: '#22c55e' },
      { shape: 'rounded', color: { type: 'linear', rotation: 90, stops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#ec4899' }] } },
    ],
  }),
}

for (const [name, svg] of Object.entries(codes)) {
  const path = join(outDir, `${name}.svg`)

  await Bun.write(path, svg)
  console.log(`wrote ${path}`)
}

console.log(`\n${Object.keys(codes).length} QR codes generated in ${outDir}`)
