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

async function lint(code: string, filename = "cartridges/app_sfra/cartridge/controllers/Home.js") {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
  })

  const results = await eslint.lintText(code, { filePath: filename })
  return results[0]?.messages || []
}

describe("sfcc/no-e4x-syntax", () => {
  test("reports JSX/E4X-like syntax in JS files", async () => {
    const messages = await lint("const x = <a/>; module.exports = x")

    expect(messages.some((m) => m.ruleId === "sfcc/no-e4x-syntax")).toBe(true)
  })

  test("allows XML and XMLList constructor-style usage", async () => {
    const messages = await lint(`
      const xmlCtor = XML
      const xmlListCtor = XMLList
      module.exports = { xmlCtor, xmlListCtor }
    `)

    expect(messages.some((m) => m.ruleId === "sfcc/no-e4x-syntax")).toBe(false)
  })

  test("shows parsing error for default xml namespace declaration", async () => {
    const messages = await lint('default xml namespace = "urn:test"')

    expect(messages.some((m) => m.fatal === true)).toBe(true)
    expect(messages.some((m) => m.ruleId === "sfcc/no-e4x-syntax")).toBe(false)
  })

  test("keeps JSDoc-based typing flow in JS files", async () => {
    const messages = await lint(`
      /** @param {{ productID: string }} body */
      function buildContext(body) {
        return { productID: body.productID }
      }
      module.exports = buildContext({ productID: "123" })
    `)

    expect(messages.some((m) => m.ruleId === "sfcc/no-e4x-syntax")).toBe(false)
  })
})
