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
    'antfu/no-top-level-await': 'off',
    'github/array-foreach': 'error',
    'github/no-then': 'error',
    'logical-assignment-operators': ['error', 'always', { enforceForIfStatements: true }],
    'no-console': 'off',
    'no-empty-function': 'off',
    'node/prefer-global/process': 'off',
    'operator-assignment': ['error', 'always'],
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
    'unicorn/no-new-array': 'off',
  },
  typescript: true,
})
