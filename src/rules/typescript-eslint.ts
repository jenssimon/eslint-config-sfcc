import type { Linter } from "eslint"

// Disable @typescript-eslint rules that are incompatible with the
// SFCC/Rhino environment or conflict with CommonJS module patterns.
const typescriptEslint: Linter.RulesRecord = { "@typescript-eslint/no-require-imports": "off" }

export default typescriptEslint
