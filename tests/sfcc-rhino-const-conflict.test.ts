import { Linter } from "eslint"
import { expect, test } from "vite-plus/test"

import { recommended } from "../src/index.js"

function lint(
  code: string,
  filename = "cartridges/app_sfra/cartridge/controllers/Home.js",
  fix = false,
): Linter.LintMessage[] | Linter.FixReport {
  const linter = new Linter()

  if (fix) {
    return linter.verifyAndFix(code, recommended, { filename })
  }

  return linter.verify(code, recommended, { filename })
}

test("same const name in two sibling if-blocks is reported", () => {
  const messages = lint(`
    function routeA() {
      if (foo === "bar") {
        const test = 1
        return test
      }
      if (foo === "baz") {
        const test = 2
        return test
      }
    }
  `) as Linter.LintMessage[]

  const hits = messages.filter((m) => m.ruleId === "sfcc/rhino-const-conflict")
  expect(hits.length).toBe(2)
})

test("const with unique name in if-block is not reported", () => {
  const messages = lint(`
    function routeA() {
      if (foo === "bar") {
        const uniqueA = 1
        return uniqueA
      }
      if (foo === "baz") {
        const uniqueB = 2
        return uniqueB
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-conflict")).toBe(false)
})

test("const at function top-level + same name in nested block is reported (nested one)", () => {
  const messages = lint(`
    function routeA() {
      const x = 1
      if (flag) {
        const x = 2
        return x
      }
      return x
    }
  `) as Linter.LintMessage[]

  const hits = messages.filter((m) => m.ruleId === "sfcc/rhino-const-conflict")
  // Only the nested one is reported (the function-level one is safe on its own)
  expect(hits.length).toBe(1)
})

test("same name in nested function does not conflict with outer function", () => {
  const messages = lint(`
    function outer() {
      if (flag) {
        const x = 1
        return x
      }
    }
    function inner() {
      if (flag) {
        const x = 2
        return x
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-conflict")).toBe(false)
})

test("same name in nested block of inner function does not conflict with outer block", () => {
  const messages = lint(`
    function outer() {
      if (flag) {
        const x = 1
        var cb = function () {
          if (other) {
            const x = 2
            return x
          }
        }
        return x
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-conflict")).toBe(false)
})

test("fixes conflicting const declarations to let", () => {
  const result = lint(
    `
      function routeA() {
        if (foo === "bar") {
          const test = 1
          return test
        }
        if (foo === "baz") {
          const test = 2
          return test
        }
      }
    `,
    undefined,
    true,
  ) as Linter.FixReport

  expect(result.fixed).toBe(true)
  const occurrences = [...result.output.matchAll(/let test/gu)]
  expect(occurrences.length).toBe(2)
})

test("prefer-const does not fire on let that replaced a conflicting const", () => {
  // After rhino-const-conflict fix: let test in both blocks.
  // sfcc/prefer-const must NOT suggest changing them back to const
  // because they are in Rhino-critical nested blocks.
  const linter = new Linter()
  const messages = linter.verify(
    `
      function routeA() {
        if (foo === "bar") {
          let test = 1
          return test
        }
        if (foo === "baz") {
          let test = 2
          return test
        }
      }
    `,
    recommended,
    { filename: "cartridges/app_sfra/cartridge/controllers/Home.js" },
  )

  expect(messages.some((m) => m.ruleId === "sfcc/prefer-const")).toBe(false)
  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-conflict")).toBe(false)
})
