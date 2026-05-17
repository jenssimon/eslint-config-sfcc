import { ESLint } from "eslint"
import unicorn from "eslint-plugin-unicorn"
import { expect, test, describe } from "vite-plus/test"

import { createRecommendedConfig } from "../src/index.js"

const unicornRecommended = unicorn.configs["flat/recommended"]
const sfccRecommended = createRecommendedConfig({
  files: ["**/*.{js,ts,ds}"],
  ignores: [],
})

async function lint(code: string, filename = "fixture.js") {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      ...(Array.isArray(unicornRecommended) ? unicornRecommended : [unicornRecommended]),
      ...sfccRecommended,
    ],
  })
  const results = await eslint.lintText(code, { filePath: filename })
  return results[0]?.messages || []
}

describe("unicorn:recommended config", () => {
  test("flags legacy underscore controller filename", async () => {
    const code = "module.exports = function handle() {}"
    const messages = await lint(code, "cartridges/app/cartridge/controllers/checkout_controller.js")
    expect(messages.some((m) => m.ruleId === "unicorn/filename-case")).toBe(true)
  })

  test("allows kebab-case controller filename", async () => {
    const code = "module.exports = function handle() {}"
    const messages = await lint(code, "cartridges/app/cartridge/controllers/checkout-controller.js")

    expect(messages.length).toBe(0)
  })

  test("flags legacy helper filename with underscores", async () => {
    const code = "module.exports = function mapProduct() {}"
    const messages = await lint(code, "cartridges/app/cartridge/scripts/product_detail_helper.js")
    expect(messages.some((m) => m.ruleId === "unicorn/filename-case")).toBe(true)
  })

  test("allows kebab-case helper filename", async () => {
    const code = "module.exports = function mapProduct() {}"
    const messages = await lint(code, "cartridges/app/cartridge/scripts/product-detail-helper.js")
    expect(messages.length).toBe(0)
  })
})
