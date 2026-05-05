import { Linter } from "eslint"
import { expect, test } from "vite-plus/test"

import { recommended } from "../src/index.js"

function lint(
  code: string,
  filename = "cartridges/app_sfra/cartridge/scripts/fixture.js",
  fix = false,
): Linter.LintMessage[] | Linter.FixReport {
  const linter = new Linter()

  if (fix) {
    return linter.verifyAndFix(code, recommended, { filename })
  }

  return linter.verify(code, recommended, { filename })
}

test("let at function top-level that is never reassigned is reported", () => {
  const messages = lint(`
    function routeA() {
      let x = 1
      return x
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sitegenesis/prefer-const")).toBe(true)
})

test("let that is reassigned is not reported", () => {
  const messages = lint(`
    function routeA() {
      let x = 1
      x = 2
      return x
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sitegenesis/prefer-const")).toBe(false)
})

test("let in nested block (Rhino-critical) is not reported", () => {
  const messages = lint(`
    function routeA() {
      if (true) {
        let x = 1
        return x
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sitegenesis/prefer-const")).toBe(false)
})

test("let in for-of header (Rhino-critical) is not reported", () => {
  const messages = lint(`
    function routeA() {
      const arr = [1, 2, 3]
      for (let item of arr) {
        console.log(item)
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sitegenesis/prefer-const")).toBe(false)
})

test("fixes let to const at function top-level", () => {
  const result = lint(
    `
      function routeA() {
        let x = 1
        return x
      }
    `,
    undefined,
    true,
  ) as Linter.FixReport

  expect(result.fixed).toBe(true)
  expect(result.output).toContain("const x = 1")
})

test("no conflict: const in nested block gets fixed to let, not re-reported by prefer-const", () => {
  // Start: const in critical scope → rhino-const-compat fires, fixes to let.
  // After fix: let in critical scope → sitegenesis/prefer-const does NOT fire.
  const result = lint(
    `
      function routeA() {
        if (true) {
          const x = 1
          return x
        }
      }
    `,
    undefined,
    true,
  ) as Linter.FixReport

  expect(result.fixed).toBe(true)
  expect(result.output).toContain("let x = 1")

  // The fixed output must be fully clean — no further errors.
  const linter = new Linter()
  const messages = linter.verify(result.output, recommended, {
    filename: "cartridges/app_sfra/cartridge/scripts/fixture.js",
  })
  expect(messages.filter((m) => m.severity > 0)).toHaveLength(0)
})
