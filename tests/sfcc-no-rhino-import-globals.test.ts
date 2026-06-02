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
    files: ["**/*.js"],
    ignores: [],
  }),
]

async function lint(code: string, filename = "cartridges/app_sfra/cartridge/scripts/fixture.js") {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
  })

  const results = await eslint.lintText(code, { filePath: filename })
  return results[0]?.messages || []
}

describe("sfcc/no-rhino-import-globals", () => {
  test("reports importScript usage", async () => {
    const messages = await lint('importScript("scripts/util");')

    expect(messages.some((m) => m.ruleId === "sfcc/no-rhino-import-globals")).toBe(true)
  })

  test("reports importPackage usage", async () => {
    const messages = await lint('importPackage("dw.catalog")')

    expect(messages.some((m) => m.ruleId === "sfcc/no-rhino-import-globals")).toBe(true)
  })

  test("reports importClass usage", async () => {
    const messages = await lint("importClass(Packages.java.lang.String)")

    expect(messages.some((m) => m.ruleId === "sfcc/no-rhino-import-globals")).toBe(true)
  })

  test("allows CommonJS require", async () => {
    const messages = await lint('const Logger = require("dw/system/Logger")')

    expect(messages.some((m) => m.ruleId === "sfcc/no-rhino-import-globals")).toBe(false)
  })
})
