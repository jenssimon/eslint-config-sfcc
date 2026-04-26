import { Linter } from "eslint"
import { expect, test } from "vite-plus/test"

import { recommended } from "../src/index.js"

function lint(
  code: string,
  filename = "cartridges/app_sfra/cartridge/scripts/fixture.js",
): Linter.LintMessage[] {
  const linter = new Linter()
  return linter.verify(code, recommended, { filename })
}

test("valid ES5 CommonJS code produces no errors", () => {
  const messages = lint(`
    var x = 1
    var obj = { name: "SFCC", version: 1 }
    function greet(name) {
      return "Hello, " + name
    }
    module.exports = { greet: greet }
  `)
  expect(messages.filter((m) => m.severity > 0)).toHaveLength(0)
})

test("template literals are reported as errors (es/no-template-literals)", () => {
  const messages = lint("var x = `hello world`")
  expect(messages.some((m) => m.ruleId === "es/no-template-literals")).toBe(true)
})

test("class declarations are reported as errors (es/no-classes)", () => {
  const messages = lint(`class Animal { constructor() {} }`)
  expect(messages.some((m) => m.ruleId === "es/no-classes")).toBe(true)
})

test("for-of loops are reported as errors (es/no-for-of-loops)", () => {
  const messages = lint(`var arr = [1,2,3]; for (var n of arr) {}`)
  expect(messages.some((m) => m.ruleId === "es/no-for-of-loops")).toBe(true)
})

test("rest parameters are reported as errors (es/no-rest-parameters)", () => {
  const messages = lint(`function sum() { var args = arguments; return args }`)
  // rest params version for comparison
  const messagesRest = lint("function sum(...args) { return args }")
  expect(messagesRest.some((m) => m.ruleId === "es/no-rest-parameters")).toBe(true)
  expect(messages.filter((m) => m.severity > 0)).toHaveLength(0)
})

test("nullish coalescing operator is reported as error (es/no-nullish-coalescing-operators)", () => {
  const messages = lint(`var x = null ?? "default"`)
  expect(messages.some((m) => m.ruleId === "es/no-nullish-coalescing-operators")).toBe(true)
})

test("optional chaining is reported as error (es/no-optional-chaining)", () => {
  const messages = lint(`var x = obj?.foo`)
  expect(messages.some((m) => m.ruleId === "es/no-optional-chaining")).toBe(true)
})

test("client folder files are ignored", () => {
  const messages = lint(
    `var x = "hello world"`,
    "cartridges/app_sfra/cartridge/client/default/js/app.js",
  )
  expect(messages.filter((m) => m.severity > 0)).toHaveLength(0)
})

test("static folder files are ignored", () => {
  const messages = lint(
    `var x = "hello world"`,
    "cartridges/app_sfra/cartridge/static/default/js/app.js",
  )
  expect(messages.filter((m) => m.severity > 0)).toHaveLength(0)
})
