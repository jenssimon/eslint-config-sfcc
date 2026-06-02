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

async function lint(
  code: string,
  filename = "cartridges/app_sfra/cartridge/controllers/Home.js",
  fix = false,
) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
    fix,
  })

  const results = await eslint.lintText(code, { filePath: filename })
  return results[0]
}

function applySuggestion(code: string, suggestion: { fix?: any }): string {
  const fixes = Array.isArray(suggestion.fix)
    ? [...suggestion.fix]
    : suggestion.fix
      ? [suggestion.fix]
      : []

  return fixes
    .sort((left, right) => right.range[0] - left.range[0])
    .reduce((output, fix) => {
      return `${output.slice(0, fix.range[0])}${fix.text}${output.slice(fix.range[1])}`
    }, code)
}

describe("sfcc/no-type-annotations", () => {
  test("reports variable type annotation in JS", async () => {
    const result = await lint('const x: string = "foo"; module.exports = x')
    const messages = result?.messages ?? []
    const hit = messages.find((m) => m.ruleId === "sfcc/no-type-annotations")

    expect(messages.some((m) => m.ruleId === "sfcc/no-type-annotations")).toBe(true)
    expect((hit?.suggestions?.length ?? 0) > 0).toBe(true)
    expect(hit?.suggestions?.[0]?.desc).toContain("JSDoc")
  })

  test("applies JSDoc suggestion for variable type annotation", async () => {
    const code = 'const x: string = "foo"; module.exports = x'
    const result = await lint(code)
    const hit = result?.messages.find((m) => m.ruleId === "sfcc/no-type-annotations")
    const suggestion = hit?.suggestions?.[0]

    expect(suggestion).toBeDefined()
    expect(applySuggestion(code, suggestion as { fix?: any })).toContain("/** @type {string} */")
    expect(applySuggestion(code, suggestion as { fix?: any })).toContain('const x = "foo"')
  })

  test("reports function return type annotation in JS", async () => {
    const result = await lint("function y(): number { return 1 }; module.exports = y")
    const messages = result?.messages ?? []
    const hit = messages.find((m) => m.ruleId === "sfcc/no-type-annotations")

    expect(messages.some((m) => m.ruleId === "sfcc/no-type-annotations")).toBe(true)
    expect((hit?.suggestions?.length ?? 0) > 0).toBe(true)
    expect(hit?.suggestions?.[0]?.desc).toContain("JSDoc")
  })

  test("applies JSDoc suggestion for function return annotation", async () => {
    const code = "function y(): number { return 1 }; module.exports = y"
    const result = await lint(code)
    const hit = result?.messages.find((m) => m.ruleId === "sfcc/no-type-annotations")
    const suggestion = hit?.suggestions?.[0]

    expect(suggestion).toBeDefined()
    expect(applySuggestion(code, suggestion as { fix?: any })).toContain("/** @returns {number} */")
    expect(applySuggestion(code, suggestion as { fix?: any })).toContain(
      "function y() { return 1 }",
    )
  })

  test("auto-fixes plain annotations", async () => {
    const result = await lint(
      `
        const x: string = "foo"
        function y(input: number): number {
          return input
        }
        module.exports = { x, y }
      `,
      undefined,
      true,
    )
    const output = result?.output ?? ""

    expect(output.includes('const x = "foo"')).toBe(true)
    expect(output.includes("function y(input) {")).toBe(true)
  })

  test("does not report JSDoc typing in JS", async () => {
    const result = await lint(`
      /** @param {string} input */
      function y(input) {
        return input.length
      }
      module.exports = y
    `)
    const messages = result?.messages ?? []

    expect(messages.some((m) => m.ruleId === "sfcc/no-type-annotations")).toBe(false)
  })

  test("does not suggest JSDoc when it already exists", async () => {
    const result = await lint(`
      /** @returns {number} */
      function y(): number {
        return 1
      }
      module.exports = y
    `)
    const messages = result?.messages ?? []
    const hit = messages.find((m) => m.ruleId === "sfcc/no-type-annotations")

    expect(messages.some((m) => m.ruleId === "sfcc/no-type-annotations")).toBe(true)
    expect(hit?.suggestions ?? []).toHaveLength(0)
  })
})
