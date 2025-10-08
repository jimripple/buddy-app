import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
})

export default [
  ...compat.extends('next', 'next/core-web-vitals', 'plugin:prettier/recommended'),
  ...compat.config({
    rules: {
      'prettier/prettier': [
        'error',
        {
          semi: false,
          singleQuote: true,
          trailingComma: 'es5',
          printWidth: 90,
          tabWidth: 2,
          bracketSpacing: true,
        },
      ],
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  }),
]
