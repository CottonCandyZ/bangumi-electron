module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended-latest',
    'plugin:@typescript-eslint/recommended',
    'plugin:@tanstack/eslint-plugin-query/recommended',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    // React Compiler can safely skip unsupported components. Keep existing Hooks
    // correctness rules strict while the compiler-specific diagnostics are paid
    // down incrementally instead of making the whole legacy renderer unlintable.
    'react-hooks/static-components': 'warn',
    'react-hooks/use-memo': 'warn',
    'react-hooks/void-use-memo': 'warn',
    'react-hooks/preserve-manual-memoization': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/globals': 'warn',
    'react-hooks/refs': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/error-boundaries': 'warn',
    'react-hooks/purity': 'warn',
    'react-hooks/set-state-in-render': 'warn',
    'react-hooks/config': 'warn',
    'react-hooks/gating': 'warn',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
