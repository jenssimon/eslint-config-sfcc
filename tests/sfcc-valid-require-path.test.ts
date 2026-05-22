import { Linter } from "eslint"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { expect, test } from "vite-plus/test"

import { recommended } from "../src/index.js"

function lint(code: string, filename = "cartridges/app_sfra/cartridge/controllers/Home.js") {
  const linter = new Linter()
  return linter.verify(code, recommended, { filename })
}

test("allows dw requires", () => {
  const messages = lint(`
    const OrderMgr = require("dw/order/OrderMgr")
    module.exports = OrderMgr
  `)

  expect(messages.some((m) => m.ruleId === "sfcc/valid-require-path")).toBe(false)
})

test("allows cartridge-style requires", () => {
  const messages = lint(`
    const helper = require("app_storefront/cartridge/scripts/helper")
    module.exports = helper
  `)

  expect(messages.some((m) => m.ruleId === "sfcc/valid-require-path")).toBe(false)
})

test("allows relative requires", () => {
  const messages = lint(`
    const one = require("./test")
    const two = require("../test")
    module.exports = { one, two }
  `)

  expect(messages.some((m) => m.ruleId === "sfcc/valid-require-path")).toBe(false)
})

test("allows SFCC star and tilde requires", () => {
  const messages = lint(`
    const one = require("*/cartridge/scripts/middleware/csrf")
    const two = require("~/cartridge/scripts/middleware/auth")
    module.exports = { one, two }
  `)

  expect(messages.some((m) => m.ruleId === "sfcc/valid-require-path")).toBe(false)
})

test("allows configured default bare module server", () => {
  const messages = lint(`
    const server = require("server")
    module.exports = server
  `)

  expect(messages.some((m) => m.ruleId === "sfcc/valid-require-path")).toBe(false)
})

test("reports invalid bare module requires", () => {
  const messages = lint(`
    const lodash = require("lodash")
    module.exports = lodash
  `)

  expect(messages.some((m) => m.ruleId === "sfcc/valid-require-path")).toBe(true)
})

test("ignores dynamic requires", () => {
  const messages = lint(`
    const moduleName = "dw/order/OrderMgr"
    const dynamic = require(moduleName)
    module.exports = dynamic
  `)

  expect(messages.some((m) => m.ruleId === "sfcc/valid-require-path")).toBe(false)
})

test("supports checkCartridgeExists option", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "eslint-config-sfcc-"))
  const cartridgesDir = path.join(tempRoot, "cartridges")
  const existingCartridge = path.join(cartridgesDir, "app_storefront")

  fs.mkdirSync(existingCartridge, { recursive: true })

  const linter = new Linter()
  const config: Linter.Config[] = [
    {
      ...recommended[0],
      rules: {
        ...recommended[0]?.rules,
        "sfcc/valid-require-path": [
          "error",
          {
            checkCartridgeExists: true,
            cartridgesDir,
          },
        ],
      },
    },
  ]

  const messages = linter.verify(
    `
      const ok = require("app_storefront/cartridge/scripts/ok")
      const bad = require("missing_cartridge/cartridge/scripts/bad")
      module.exports = { ok, bad }
    `,
    config,
    { filename: "cartridges/app_sfra/cartridge/controllers/Home.js" },
  )

  fs.rmSync(tempRoot, { recursive: true, force: true })

  const hits = messages.filter((m) => m.ruleId === "sfcc/valid-require-path")
  expect(hits).toHaveLength(1)
  expect(hits[0]?.message.includes("missing_cartridge")).toBe(true)
})
