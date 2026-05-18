import type { Linter } from "eslint"

const sfcc: Linter.RulesRecord = {
  "sfcc/prefer-const": "error",
  "sfcc/rhino-const-compat": "error",
  "sfcc/rhino-const-conflict": "error",
}

export default sfcc
