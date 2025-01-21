import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { FlatCompat } from '@eslint/eslintrc'


// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url) // eslint-disable-line no-underscore-dangle
const __dirname = path.dirname(__filename) // eslint-disable-line no-underscore-dangle

const compat = new FlatCompat({
  baseDirectory: __dirname,
})


export default [
  {
    ignores: [
      '.yarn/',
      '.yalc/',
    ],
  },

  ...compat.config({
    extends: [
      '@jenssimon/base',
    ],
  }).map((rule) => ({
    files: [
      '**/*.js',
      '**/*.mjs',
    ],
    ...rule,
  })),

  {
    files: [
      '**/*.js',
    ],
    rules: {
      'unicorn/prefer-module': 'off',
    },
  },
]
