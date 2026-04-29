import type { Linter } from "eslint"

import core from "./core.js"
import es from "./es.js"
import sonarjs from "./sonarjs.js"
import typescriptEslint from "./typescript-eslint.js"
import unicorn from "./unicorn.js"

const rules: Linter.RulesRecord = {
  ...core,
  ...unicorn,
  ...sonarjs,
  ...typescriptEslint,
  ...es,
}

export default rules
