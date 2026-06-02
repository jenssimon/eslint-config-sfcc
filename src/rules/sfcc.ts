import type { Linter } from "eslint"

const sfcc: Linter.RulesRecord = {
  "sfcc/no-ds-files": "error",
  "sfcc/no-e4x-syntax": "error",
  "sfcc/no-type-annotations": "error",
  "sfcc/no-rhino-import-globals": "error",
  "sfcc/prefer-const": "error",
  "sfcc/rhino-const-compat": "error",
  "sfcc/rhino-const-conflict": "error",
  "sfcc/valid-require-path": "error",
}

export default sfcc
