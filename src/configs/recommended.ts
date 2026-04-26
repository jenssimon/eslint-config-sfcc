import type { Linter } from "eslint"

import { fixupPluginRules } from "@eslint/compat"
import es from "eslint-plugin-es"
import globals from "globals"

import rules from "../rules/index.js"
import sfccGlobals from "../sfcc-globals.js"

export interface RecommendedConfigOptions {
  /** Base directory that contains all cartridges (with or without trailing /). */
  cartridgesDir?: string
  /** Optional override for file globs. */
  files?: string[]
  /** Optional override for ignore globs. */
  ignores?: string[]
}

/** Creates the recommended flat config for SFCC projects. */
export function createRecommendedConfig(options: RecommendedConfigOptions = {}): Linter.Config[] {
  const { cartridgesDir = "cartridges", files, ignores } = options
  const normalizedCartridgesDir = cartridgesDir.replace(/\/+$/u, "") || "/"

  function withBaseDir(suffix: string): string {
    return normalizedCartridgesDir === "/" ? `/${suffix}` : `${normalizedCartridgesDir}/${suffix}`
  }

  return [
    {
      files: files ?? [withBaseDir("**/*.{js,ds}")],
      ignores: ignores ?? [
        withBaseDir("*/cartridge/client/**"),
        withBaseDir("*/cartridge/static/**"),
      ],
      languageOptions: {
        sourceType: "commonjs",
        globals: {
          ...globals.commonjs,
          ...sfccGlobals,
        },
      },
      plugins: {
        es: fixupPluginRules(es as never),
      },
      rules,
    },
  ]
}

/** Shareable config for SFCC projects */
const recommended: Linter.Config[] = createRecommendedConfig()

export default recommended
