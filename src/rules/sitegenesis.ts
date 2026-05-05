import type { Linter } from "eslint"

const sitegenesis: Linter.RulesRecord = {
  "sitegenesis/no-global-require": "error",
  "sitegenesis/prefer-const": "error",
  "sitegenesis/rhino-const-compat": "error",
}

export default sitegenesis
