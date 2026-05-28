import { Linter } from "eslint"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { expect, test } from "vite-plus/test"

import { createRecommendedConfig, recommended } from "../src/index.js"

function lint(code: string, filename = "cartridges/app_sfra/cartridge/controllers/Home.js") {
  const linter = new Linter()
  return linter.verify(code, recommended, { filename })
}

function createTempTestRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sfcc-test-root-"))
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
  const tempRoot = createTempTestRoot()
  const tempCartridgesDir = path.join(tempRoot, "cartridges")
  const ownCartridgeName = "app_sfra"
  const existingCartridgeName = "app_storefront"
  const existingCartridge = path.join(tempCartridgesDir, existingCartridgeName)
  const ownCartridge = path.join(tempCartridgesDir, ownCartridgeName)
  const filename = "cartridges/app_sfra/cartridge/controllers/Home.js"

  fs.mkdirSync(path.join(existingCartridge, "cartridge", "scripts"), { recursive: true })
  fs.mkdirSync(path.join(ownCartridge, "cartridge", "scripts"), { recursive: true })
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  fs.writeFileSync(
    path.join(existingCartridge, "cartridge", "scripts", "ok.js"),
    "module.exports = true",
  )
  fs.writeFileSync(
    path.join(ownCartridge, "cartridge", "scripts", "local.js"),
    "module.exports = true",
  )

  try {
    const linter = new Linter()
    const config = createRecommendedConfig({
      sfcc: {
        checkCartridgeExists: true,
        cartridgesDir: tempCartridgesDir,
      },
    })

    const messages = linter.verify(
      `
        const ok = require("${existingCartridgeName}/cartridge/scripts/ok")
        const okStar = require("*/cartridge/scripts/ok")
        const bad = require("missing_cartridge/cartridge/scripts/bad")
        const badStar = require("*/cartridge/scripts/does-not-exist")
        module.exports = { ok, okStar, bad, badStar }
      `,
      config,
      { filename },
    )

    const hits = messages.filter((m) => m.ruleId === "sfcc/valid-require-path")
    expect(hits).toHaveLength(2)
    expect(hits[0]?.message.includes("missing_cartridge")).toBe(true)
    expect(hits.some((m) => m.message.includes("*/cartridge/scripts/does-not-exist"))).toBe(true)
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("supports cartridge order from site template", () => {
  const tempRoot = createTempTestRoot()
  const tempCartridgesDir = path.join(tempRoot, "cartridges")
  const cartridgeName = "app_storefront"
  const ownCartridgeName = "app_sfra"
  const targetCartridge = path.join(tempCartridgesDir, cartridgeName)
  const ownCartridge = path.join(tempCartridgesDir, ownCartridgeName)
  const siteTemplatePath = path.join(tempRoot, "site_template")
  const site = "example"
  const siteTemplateXmlPath = path.join(siteTemplatePath, "sites", site, "site.xml")
  const filename = "cartridges/app_sfra/cartridge/controllers/Home.js"

  fs.mkdirSync(path.join(targetCartridge, "cartridge", "scripts"), { recursive: true })
  fs.mkdirSync(path.join(ownCartridge, "cartridge", "scripts"), { recursive: true })
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  fs.mkdirSync(path.dirname(siteTemplateXmlPath), { recursive: true })
  fs.writeFileSync(
    path.join(targetCartridge, "cartridge", "scripts", "ok.js"),
    "module.exports = true",
  )
  try {
    fs.writeFileSync(
      siteTemplateXmlPath,
      `<site><custom-cartridges>app_base:${cartridgeName}:int_payments</custom-cartridges></site>`,
    )

    const linter = new Linter()
    const config = createRecommendedConfig({
      sfcc: {
        checkCartridgeExists: true,
        cartridgesDir: tempCartridgesDir,
        siteTemplatePath,
        site,
      },
    })

    const messages = linter.verify(
      `
        const okStar = require("*/cartridge/scripts/ok")
        module.exports = { okStar }
      `,
      config,
      { filename },
    )

    expect(messages.some((m) => m.ruleId === "sfcc/valid-require-path")).toBe(false)
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("rejects direct rule options and requires shared settings", () => {
  const linter = new Linter()

  const config: Linter.Config[] = [
    {
      ...recommended[0],
      rules: {
        ...recommended[0]?.rules,
        "sfcc/valid-require-path": ["error", { checkCartridgeExists: true }],
      },
    },
  ]

  expect(() =>
    linter.verify('const x = require("server"); module.exports = x', config, {
      filename: "cartridges/app_sfra/cartridge/controllers/Home.js",
    }),
  ).toThrow()
})
