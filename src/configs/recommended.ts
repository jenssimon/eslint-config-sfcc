import type { Linter } from "eslint"

import { fixupPluginRules } from "@eslint/compat"
import es from "eslint-plugin-es"
import globals from "globals"

import type { SfccSettings } from "../types/sfcc-settings.js"

import sfcc from "../plugins/sfcc/index.js"
import sitegenesis from "../plugins/sitegenesis/index.js"
import rules from "../rules/index.js"
import sfccGlobals from "../sfcc-globals.js"

export interface RecommendedConfigOptions {
  /** Base directory that contains all cartridges (with or without trailing /). */
  cartridgesDir?: string
  /** Optional override for file globs. */
  files?: string[]
  /** Optional override for ignore globs. */
  ignores?: string[]
  /** Optional shared options for sfcc rules. */
  sfcc?: SfccSettings
}

/** Creates the recommended flat config for SFCC projects. */
export function createRecommendedConfig(options: RecommendedConfigOptions = {}): Linter.Config[] {
  const { cartridgesDir = "cartridges", files, ignores, sfcc: sfccOptions } = options
  const normalizedCartridgesDir = cartridgesDir.replace(/\/+$/u, "") || "/"
  const hasSfccOptions =
    sfccOptions !== undefined &&
    (sfccOptions.allowBareModules !== undefined ||
      sfccOptions.checkCartridgeExists !== undefined ||
      sfccOptions.cartridgePath !== undefined ||
      sfccOptions.cartridgesDir !== undefined)

  const sfccSettings: SfccSettings | undefined = hasSfccOptions
    ? {
        ...sfccOptions,
        ...(sfccOptions?.cartridgesDir === undefined
          ? { cartridgesDir: normalizedCartridgesDir }
          : {}),
      }
    : undefined

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
        sfcc,
        sitegenesis,
      },
      ...(sfccSettings === undefined ? {} : { settings: { sfcc: sfccSettings } }),
      rules,
    },
  ]
}

/** Shareable config for SFCC projects */
const recommended: Linter.Config[] = createRecommendedConfig()

export default recommended
