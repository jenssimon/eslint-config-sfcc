import type { Linter } from "eslint"

// Disable ESLint core rules that suggest or require ES2015+ syntax.
// SFCC sandboxes run on Rhino (ES5), so these patterns are not supported.
const core: Linter.RulesRecord = {
  "no-restricted-properties": "off",
  "object-shorthand": "off",
  "prefer-arrow-callback": "off",
  "prefer-const": "off",
  "prefer-exponentiation-operator": "off",
  "prefer-object-has-own": "off",
  "prefer-object-spread": "off",
  "prefer-rest-params": "off",
  "prefer-spread": "off",
  "prefer-template": "off",
  "preserve-caught-error": "off",
}

export default core
