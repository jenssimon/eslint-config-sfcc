import { ESLint } from "eslint"
import sonarjs from "eslint-plugin-sonarjs"
import { expect, test, describe } from "vite-plus/test"

import { createRecommendedConfig } from "../src/index.js"

const sonarjsRecommended = [
  {
    plugins: { sonarjs },
    rules: sonarjs.configs.recommended.rules,
  },
  ...createRecommendedConfig({
    files: ["**/*.{js,ts,ds}"],
    ignores: [],
  }),
]

async function lint(code: string, filename = "fixture.js") {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: sonarjsRecommended,
  })
  const results = await eslint.lintText(code, { filePath: filename })
  return results[0]?.messages || []
}

describe("sonarjs:recommended config", () => {
  test("flags duplicated order status branches", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      function resolveOrderBadge(status) {
        if (status === "OPEN") {
          return "pending"
        } else {
          return "pending"
        }
      }
      Logger.info(resolveOrderBadge("OPEN"))
    `
    const messages = await lint(code)
    expect(messages.some((m) => m.ruleId && m.ruleId.includes("no-all-duplicated-branches"))).toBe(
      true,
    )
  })

  test("allows distinct order status branches", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      function resolveOrderBadge(status) {
        if (status === "OPEN") {
          return "pending"
        } else if (status === "IN_PROGRESS") {
          return "active"
        }
        return "done"
      }
      Logger.info(resolveOrderBadge("OPEN"))
    `
    const messages = await lint(code)
    expect(messages.length).toBe(0)
  })

  test("flags duplicated payment state branches", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      function normalizePaymentState(state) {
        if (state === "PAID") {
          return "settled"
        } else {
          return "settled"
        }
      }
      Logger.info(normalizePaymentState("PAID"))
    `
    const messages = await lint(code)
    expect(messages.some((m) => m.ruleId && m.ruleId.includes("no-all-duplicated-branches"))).toBe(
      true,
    )
  })

  test("allows distinct payment state branches", async () => {
    const code = `
      const Logger = require("dw/system/Logger")
      function normalizePaymentState(state) {
        if (state === "PAID") {
          return "settled"
        } else if (state === "CAPTURED") {
          return "captured"
        }
        return "open"
      }
      Logger.info(normalizePaymentState("PAID"))
    `
    const messages = await lint(code)
    expect(messages.length).toBe(0)
  })
})
