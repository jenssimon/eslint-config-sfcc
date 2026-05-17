import js from "@eslint/js"
import { ESLint } from "eslint"
import * as globals from "globals"
import { expect, test, describe } from "vite-plus/test"

import { createRecommendedConfig } from "../src/index.js"

const eslintRecommended = [
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  ...createRecommendedConfig({
    files: ["**/*.{js,ts,ds}"],
    ignores: [],
  }),
]

async function lint(code: string, filename = "fixture.js") {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: eslintRecommended,
  })
  const results = await eslint.lintText(code, { filePath: filename })
  return results[0]?.messages || []
}

describe("eslint:recommended config", () => {
  test("flags undefined symbol in business logic", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      function calculateTax(total) {
        return total * TAX_RATE
      }
      Logger.info(calculateTax(100))
    `
    const messages = await lint(code)
    expect(messages.some((m) => m.ruleId === "no-undef")).toBe(true)
  })

  test("allows defined constants and usage", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      const TAX_RATE = 0.19
      function calculateTax(total) {
        return total * TAX_RATE
      }
      Logger.info(calculateTax(100))
    `
    const messages = await lint(code)
    expect(messages.length).toBe(0)
  })

  test("flags assignment in condition", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      function shouldRenderPromo(customer) {
        let isAuthenticated = false
        if (isAuthenticated = customer.authenticated) {
          return true
        }
        return false
      }
      Logger.info(shouldRenderPromo({ authenticated: true }))
    `
    const messages = await lint(code)
    expect(messages.some((m) => m.ruleId === "no-cond-assign")).toBe(true)
  })

  test("allows safe condition check", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      function shouldRenderPromo(customer) {
        const isAuthenticated = customer.authenticated === true
        if (isAuthenticated) {
          return true
        }
        return false
      }
      Logger.info(shouldRenderPromo({ authenticated: true }))
    `
    const messages = await lint(code)
    expect(messages.length).toBe(0)
  })
})
