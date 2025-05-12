import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

// Create .vscode/settings.json
mkdirSync('.vscode', { recursive: true })
writeFileSync('.vscode/settings.json', JSON.stringify({
  'eslint.useFlatConfig': true,
  'prettier.enable': false,
  'editor.formatOnSave': false,
  'editor.codeActionsOnSave': {
    'source.fixAll.eslint': 'always',
    'source.organizeImports': 'never',
  },
  'eslint.rules.customizations': [
    { rule: 'style/*', severity: 'off' },
    { rule: 'format/*', severity: 'off' },
    { rule: '*-indent', severity: 'off' },
    { rule: '*-spacing', severity: 'off' },
    { rule: '*-spaces', severity: 'off' },
    { rule: '*-order', severity: 'off' },
    { rule: '*-dangle', severity: 'off' },
    { rule: '*-newline', severity: 'off' },
    { rule: '*quotes', severity: 'off' },
    { rule: '*semi', severity: 'off' },
  ],
  'eslint.validate': [
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
    'vue',
    'html',
    'markdown',
    'json',
    'jsonc',
    'yaml',
    'toml',
    'css',
    'tailwindcss',
    'xml',
    'gql',
    'graphql',
    'astro',
    'less',
    'scss',
    'pcss',
    'postcss',
    'github-actions-workflow',
  ],
}, null, 2))

// Create eslint.config.js
writeFileSync('eslint.config.js', `import { typescript } from '@kaynooo/eslint'\n\nexport default typescript()\n`)

// Install deps
execSync('bun add -d eslint @kaynooo/eslint', { stdio: 'inherit' })
