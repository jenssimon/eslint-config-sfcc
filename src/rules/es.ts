import type { Linter } from "eslint"

import pluginEs from "eslint-plugin-es"

const esVersionPresets = ["no-new-in-esnext"]
for (let year = 2020; year >= 2016; year--) {
  esVersionPresets.push(`no-new-in-es${year}`)
}

const getRulesFromPreset = (preset: string): [string, Linter.RuleEntry][] =>
  Object.entries(pluginEs.configs[preset]?.rules ?? {})
const getRulesFromPresets = (presets: string[]): Linter.RulesRecord =>
  Object.fromEntries(presets.flatMap(getRulesFromPreset))

// Enable eslint-plugin-es rules to forbid JavaScript features not supported
// on SFCC sandboxes. The presets cover ES2016 and above; ES2015 features are
// listed explicitly below because eslint-plugin-es has no ES2015 preset.
const es: Linter.RulesRecord = {
  ...getRulesFromPresets(esVersionPresets),

  // ES2015 features not supported on SFCC/Rhino — no preset available, listed explicitly:
  "es/no-classes": "error",
  "es/no-computed-properties": "error",
  "es/no-default-parameters": "error",
  "es/no-for-of-loops": "error",
  "es/no-generators": "error",
  "es/no-modules": "error",
  "es/no-new-target": "error",
  "es/no-promise": "error",
  "es/no-proxy": "error",
  "es/no-reflect": "error",
  "es/no-regexp-u-flag": "error",
  "es/no-regexp-y-flag": "error",
  "es/no-rest-parameters": "error",
  "es/no-spread-elements": "error",
  "es/no-subclassing-builtins": "error",
  "es/no-template-literals": "error",
}

export default es
