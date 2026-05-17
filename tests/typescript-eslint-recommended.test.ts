import tseslint from "@typescript-eslint/eslint-plugin"
import { ESLint, type Linter } from "eslint"
import { expect, test, describe } from "vite-plus/test"

import { createRecommendedConfig } from "../src/index.js"

const tsRecommended = tseslint.configs["flat/recommended"] as unknown as
  | Linter.Config
  | Linter.Config[]
const tsRecommendedConfig = [
  ...(Array.isArray(tsRecommended) ? tsRecommended : [tsRecommended]),
  ...createRecommendedConfig({
    files: ["**/*.js"],
    ignores: [],
  }),
]

async function lint(code: string, filename = "fixture.js") {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: tsRecommendedConfig,
  })
  const results = await eslint.lintText(code, { filePath: filename })
  return results[0]?.messages || []
}

describe("@typescript-eslint:recommended config", () => {
  test("flags unused request payload variable", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      /**
       * @param {{ productID: string }} body
       */
      function buildContext(body) {
        const locale = "de_DE"
        return { locale }
      }
      Logger.info(JSON.stringify(buildContext({ productID: "123" })))
    `
    const messages = await lint(code)
    expect(messages.some((m) => m.ruleId === "@typescript-eslint/no-unused-vars")).toBe(true)
  })

  test("allows used request payload variable", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      /**
       * @param {{ productID: string }} body
       */
      function buildContext(body) {
        const locale = "de_DE"
        return { locale, productID: body.productID }
      }
      Logger.info(JSON.stringify(buildContext({ productID: "123" })))
    `
    const messages = await lint(code)
    expect(messages.length).toBe(0)
  })
  test("flags unused request payload variable", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      /**
       * @param {{ productID: string }} body
       */
      function buildContext(body) {
        const locale = "de_DE"
        return { locale }
      }
      Logger.info(JSON.stringify(buildContext({ productID: "123" })))
    `
    const messages = await lint(code)
    expect(messages.some((m) => m.ruleId === "@typescript-eslint/no-unused-vars")).toBe(true)
  })

  test("allows used request payload variable", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      /**
       * @param {{ productID: string }} body
       */
      function buildContext(body) {
        const locale = "de_DE"
        return { locale, productID: body.productID }
      }
      Logger.info(JSON.stringify(buildContext({ productID: "123" })))
    `
    const messages = await lint(code)
    expect(messages.length).toBe(0)
  })
})
