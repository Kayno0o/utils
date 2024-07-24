import antfu from '@antfu/eslint-config'
import github from 'eslint-plugin-github'

export default antfu({
  ignores: [
    '**/docs/**',
  ],
  plugins: {
    github,
  },
  rules: {
    'logical-assignment-operators': ['error', 'always', { enforceForIfStatements: true }],
    'no-console': 'off',
    'no-empty-function': 'off',
    'node/prefer-global/process': 'off',
    'github/no-then': 'error',
    'github/array-foreach': 'error',
    'operator-assignment': ['error', 'always'],
    'perfectionist/sort-classes': ['warn', { type: 'natural' }],
    'perfectionist/sort-enums': ['warn', { type: 'natural' }],
    'perfectionist/sort-interfaces': ['warn', { type: 'natural' }],
    'perfectionist/sort-object-types': ['warn', { type: 'natural' }],
    'perfectionist/sort-objects': ['warn', { type: 'natural' }],
    'style/array-bracket-newline': ['warn', 'consistent'],
    'style/array-element-newline': ['warn', 'consistent'],
    'style/object-curly-newline': ['warn', { consistent: true }],
    'ts/adjacent-overload-signatures': 'error',
    'ts/array-type': 'error',
    'ts/ban-ts-comment': 'error',
    'ts/ban-tslint-comment': 'error',
    'ts/class-literal-property-style': 'error',
    'ts/consistent-generic-constructors': 'error',
    'ts/consistent-indexed-object-style': 'error',
    'ts/consistent-type-definitions': 'error',
    'ts/no-confusing-non-null-assertion': 'error',
    'ts/no-empty-function': 'error',
    'ts/no-empty-interface': 'off',
    'ts/no-inferrable-types': 'error',
    'ts/prefer-for-of': 'error',
    'ts/prefer-function-type': 'error',
    'ts/prefer-namespace-keyword': 'error',
  },
  typescript: true,
})
