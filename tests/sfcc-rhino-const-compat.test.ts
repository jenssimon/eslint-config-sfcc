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

test("const in loop body is reported", () => {
  const messages = lint(`
    function routeA() {
      for (let i = 0; i < 3; i += 1) {
        const x = i * 2
        console.log(x)
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-compat")).toBe(true)
})

test("const in for-of loop header is reported", () => {
  const messages = lint(`
    function routeA() {
      const arr = [1, 2, 3]
      for (const item of arr) {
        console.log(item)
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-compat")).toBe(true)
})

test("const in for-in loop header is reported", () => {
  const messages = lint(`
    function routeA() {
      const obj = { a: 1 }
      for (const key in obj) {
        console.log(key)
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-compat")).toBe(true)
})

test("const in standard for-loop initializer is reported", () => {
  const messages = lint(`
    function routeA() {
      const arr = [1, 2, 3]
      for (const x = 0; x < arr.length; x += 1) {
        console.log(arr[x])
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-compat")).toBe(true)
})

test("const at function top-level block is allowed", () => {
  const messages = lint(`
    function routeA() {
      const x = 1
      return x
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-compat")).toBe(false)
})

test("const in plain if block is allowed", () => {
  const messages = lint(`
    function routeA() {
      if (true) {
        const x = 1
        return x
      }
    }
  `) as Linter.LintMessage[]

  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-compat")).toBe(false)
})

test("fixes const to let in for-of loop header", () => {
  const result = lint(
    `
      function routeA() {
        const arr = [1, 2, 3]
        for (const item of arr) {
          console.log(item)
        }
      }
    `,
    undefined,
    true,
  ) as Linter.FixReport

  expect(result.fixed).toBe(true)
  expect(result.output.includes("let item of arr")).toBe(true)
})

test("fixes const to let in loop body", () => {
  const result = lint(
    `
      function routeA() {
        for (let i = 0; i < 3; i += 1) {
          const x = i * 2
          console.log(x)
        }
      }
    `,
    undefined,
    true,
  ) as Linter.FixReport

  expect(result.fixed).toBe(true)
  expect(result.output.includes("let x = i * 2")).toBe(true)
})

test("sfcc/prefer-const does not fire in the same critical scopes", () => {
  // After rhino-const-compat fixes const→let in a critical scope, the resulting
  // let must NOT be re-reported by sfcc/prefer-const.
  const linter = new Linter()
  const messages = linter.verify(
    `
      function routeA() {
        if (true) {
          let x = 1
          return x
        }
      }
    `,
    recommended,
    { filename: "cartridges/app_sfra/cartridge/controllers/Home.js" },
  )

  expect(messages.some((m) => m.ruleId === "sfcc/prefer-const")).toBe(false)
  expect(messages.some((m) => m.ruleId === "sfcc/rhino-const-compat")).toBe(false)
})
