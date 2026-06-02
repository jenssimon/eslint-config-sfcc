import tseslint from "@typescript-eslint/eslint-plugin"
import { ESLint, type Linter } from "eslint"
import { describe, expect, test } from "vite-plus/test"

import { createRecommendedConfig } from "../src/index.js"

const tsRecommended = tseslint.configs["flat/recommended"] as unknown as
  | Linter.Config
  | Linter.Config[]

const config: Linter.Config[] = [
  ...(Array.isArray(tsRecommended) ? tsRecommended : [tsRecommended]),
  ...createRecommendedConfig({
    files: ["**/*.{js,ds}"],
    ignores: [],
  }),
]

async function lint(code: string, filename: string) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
  })

  const results = await eslint.lintText(code, { filePath: filename })
  return results[0]?.messages || []
}

describe("sfcc/no-ds-files", () => {
  test("reports .ds files", async () => {
    const messages = await lint(
      "const Logger = require('dw/system/Logger'); Logger.info('ok')",
      "cartridges/app_sfra/cartridge/scripts/legacy.ds",
    )

    expect(messages.some((m) => m.ruleId === "sfcc/no-ds-files")).toBe(true)
  })

  test("does not report .js files", async () => {
    const messages = await lint(
      "const Logger = require('dw/system/Logger'); Logger.info('ok')",
      "cartridges/app_sfra/cartridge/scripts/current.js",
    )

    expect(messages.some((m) => m.ruleId === "sfcc/no-ds-files")).toBe(false)
  })
})
