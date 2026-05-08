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

test("let in nested block (Rhino-critical: loop) is not reported", () => {
  const messages = lint(`
    function routeA() {
      for (let i = 0; i < 3; i += 1) {
        let x = i * 2
        return x
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sitegenesis/prefer-const")).toBe(false)
})

test("let in plain if block (non-loop nested) is not reported by prefer-const", () => {
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
  // Start: const in sibling blocks with same name → rhino-const-conflict fires, fixes to let.
  // After fix: let in nested blocks → sitegenesis/prefer-const does NOT fire (nested blocks excluded).
  const result = lint(
    `
      function routeA() {
        if (foo === "bar") {
          const x = 1
          return x
        }
        if (foo === "baz") {
          const x = 2
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
