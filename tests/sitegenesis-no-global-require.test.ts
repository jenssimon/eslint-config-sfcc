import { Linter } from "eslint"
import { expect, test } from "vite-plus/test"

import { recommended } from "../src/index.js"

function lint(code: string, filename: string): Linter.LintMessage[] {
  const linter = new Linter()
  return linter.verify(code, recommended, { filename })
}

test("global require used in only one of two functions is reported", () => {
  const messages = lint(
    `
      const URLUtils = require("dw/web/URLUtils")
      function routeA() {
        return URLUtils.url("Home-Show")
      }
      function routeB() {
        return "ok"
      }
    `,
    "cartridges/app_sfra/cartridge/controllers/Home.js",
  )

  expect(messages.some((m) => m.ruleId === "sitegenesis/no-global-require")).toBe(true)
})

test("global require used in every function is allowed", () => {
  const messages = lint(
    `
      const URLUtils = require("dw/web/URLUtils")
      function routeA() {
        return URLUtils.url("Home-Show")
      }
      function routeB() {
        return URLUtils.url("Search-Show")
      }
    `,
    "cartridges/app_sfra/cartridge/controllers/Home.js",
  )

  expect(messages.filter((m) => m.severity > 0)).toHaveLength(0)
})

test("global require with global usage is allowed", () => {
  const messages = lint(
    `
      const URLUtils = require("dw/web/URLUtils")
      const homeUrl = URLUtils.url("Home-Show")
      function routeA() {
        return homeUrl
      }
      function routeB() {
        return "ok"
      }
    `,
    "cartridges/app_sfra/cartridge/controllers/Home.js",
  )

  expect(messages.filter((m) => m.severity > 0)).toHaveLength(0)
})

test("global require is not reported when no functions exist in scripts", () => {
  const messages = lint(
    `const URLUtils = require("dw/web/URLUtils")`,
    "cartridges/app_sfra/cartridge/scripts/helpers/url.js",
  )

  expect(messages.some((m) => m.ruleId === "sitegenesis/no-global-require")).toBe(false)
})

test("global require is not reported when no functions exist in models", () => {
  const messages = lint(
    `const URLUtils = require("dw/web/URLUtils")`,
    "cartridges/app_sfra/cartridge/models/product.js",
  )

  expect(messages.some((m) => m.ruleId === "sitegenesis/no-global-require")).toBe(false)
})

test("require declared inside a route function is allowed", () => {
  const messages = lint(
    `
      function routeA() {
        const URLUtils = require("dw/web/URLUtils")
        return URLUtils.url("Home-Show")
      }
      function routeB() {
        return "ok"
      }
    `,
    "cartridges/app_sfra/cartridge/controllers/Home.js",
  )

  expect(messages.some((m) => m.ruleId === "sitegenesis/no-global-require")).toBe(false)
})

test("top-level middleware argument usage is allowed like the original rule", () => {
  const messages = lint(
    `
      const csrfProtection = require("*/cartridge/scripts/middleware/csrf")
      server.replace("Show", csrfProtection.generateToken, function routeA() {
        return "ok"
      })
      function routeB() {
        return "ok"
      }
    `,
    "cartridges/app_sfra/cartridge/controllers/Account.js",
  )

  expect(messages.some((m) => m.ruleId === "sitegenesis/no-global-require")).toBe(false)
})
