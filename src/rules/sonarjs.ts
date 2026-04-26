import type { Linter } from "eslint"

// Disable eslint-plugin-sonarjs rules that are incompatible with the
// SFCC/Rhino environment or conflict with CommonJS module patterns.
const sonarjs: Linter.RulesRecord = { "sonarjs/no-implicit-global": "off" }

export default sonarjs
