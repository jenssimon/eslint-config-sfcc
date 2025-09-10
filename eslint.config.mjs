import { defineConfig } from 'eslint/config'
import { configs } from '@jenssimon/eslint-config-base'
import globals from 'globals'

export default defineConfig(
  {
    ignores: [
      '.yarn/',
      '.yalc/',
    ],
  },

  configs.base,

  {
    files: [
      '**/*.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'unicorn/prefer-module': 'off',
    },
  },
)
