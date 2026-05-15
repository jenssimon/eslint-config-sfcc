import { fixupPluginRules } from "@eslint/compat"
import { ESLint } from "eslint"
import es from "eslint-plugin-es"
import globals from "globals"
import { expect, test, describe } from "vite-plus/test"

import { createRecommendedConfig } from "../src/configs/recommended.js"
import sitegenesis from "../src/plugins/sitegenesis/index.js"
import rules from "../src/rules/index.js"

async function lint(
  code: string,
  filename = "cartridges/app_sfra/cartridge/scripts/fixture.js",
): Promise<any[]> {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: createRecommendedConfig(),
  })
  const results = await eslint.lintText(code, { filePath: filename })
  return results[0]?.messages || []
}

async function lintModule(code: string): Promise<any[]> {
  const moduleConfig = [
    {
      files: ["**/*.mjs"],
      languageOptions: {
        sourceType: "module" as const,
        globals: globals.commonjs,
      },
      plugins: {
        es: fixupPluginRules(es as never),
        sitegenesis,
      },
      rules,
    },
  ]
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: moduleConfig,
  })
  const results = await eslint.lintText(code, { filePath: "test.mjs" })
  return results[0]?.messages || []
}

function hasErrors(messages: any[]): boolean {
  return messages.filter((m) => m.severity > 0).length > 0
}

describe("✅ SFCC Compatibility - Valid ES5 Code", () => {
  test("✅ valid CommonJS module exports", async () => {
    const messages = await lint(`
      const obj = { name: "SFCC", version: 1 }
      function greet(name) {
        return "Hello, " + name
      }
      module.exports = { greet, obj }
    `)
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ ES5 for-in loops", async () => {
    const messages = await lint(`
      const obj = { a: 1, b: 2 }
      const keys = []
      for (let key in obj) {
        keys.push(key)
      }
      module.exports = keys
    `)
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ ES5 function expressions", async () => {
    const messages = await lint(`
      const handler = function(event) {
        return event.data
      }
      module.exports = { handler }
    `)
    expect(hasErrors(messages)).toBe(false)
  })
})

describe("✅ SFCC Compatibility - Allowed ES2015+ Features", () => {
  test("✅ const declarations", async () => {
    const messages = await lint(`
      const GREETING = "Hello"
      const greet = function(name) { return GREETING + ", " + name }
      module.exports = greet
    `)
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ let declarations", async () => {
    const messages = await lint(`
      let counter = 0
      function increment() { counter++ }
      module.exports = increment
    `)
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ arrow functions", async () => {
    const messages = await lint(`
      const toUpper = (value) => value.toUpperCase()
      module.exports = toUpper
    `)
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ destructuring", async () => {
    const messages = await lint(`
      const source = { id: 1 }
      const { id } = source
      module.exports = id
    `)
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ template literals", async () => {
    const messages = await lint(
      'const name = "SFCC"\nconst msg = `Hello ${name}`\nmodule.exports = msg',
    )
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ String.raw", async () => {
    const messages = await lint("const value = String.raw`line1\\nline2`\nmodule.exports = value")
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ Object.values", async () => {
    const messages = await lint(`
      const obj = { a: 1, b: 2 }
      const values = Object.values(obj)
      module.exports = values
    `)
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ Object.entries", async () => {
    const messages = await lint(`
      const obj = { a: 1, b: 2 }
      const entries = Object.entries(obj)
      entries.forEach(function(entry) {
        const key = entry[0]
        const value = entry[1]
      })
      module.exports = entries
    `)
    expect(hasErrors(messages)).toBe(false)
  })

  test("✅ for-of loops", async () => {
    const messages = await lint(`
      const arr = [1, 2, 3]
      let doubled
      for (let item of arr) {
        doubled = item * 2
      }
      module.exports = doubled
    `)
    expect(hasErrors(messages)).toBe(false)
  })
})

describe("❌ SFCC Compatibility - Disallowed ES2015+ Features", () => {
  describe("❌ Frequently used modern syntax that breaks in SFCC", () => {
    test("❌ Optional Chaining", async () => {
      const messages = await lint(`var x = obj?.foo`)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Nullish Coalescing", async () => {
      const messages = await lint(`
      var x = null ?? "default"
    `)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Async Functions", async () => {
      const messages = await lint(`
      async function load() {
        return 1
      }
      module.exports = load
    `)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Default Parameters", async () => {
      const messages = await lint(`function greet(name = "World") { return name }`)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Rest Parameters", async () => {
      const messages = await lint(`function sum(...args) { return args }`)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Spread in function calls", async () => {
      const messages = await lint(`
      const args = [1, 2, 3]
      Math.max(...args)
    `)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Spread in Arrays", async () => {
      const messages = await lint(`
      const arr1 = [1, 2, 3]
      const arr2 = [...arr1, 4, 5]
      module.exports = arr2
    `)
      expect(hasErrors(messages)).toBe(true)
    })
  })

  describe("❌ Additional unsupported language patterns", () => {
    test("❌ ES Module Import", async () => {
      const messages = await lintModule(`import greet from "./greet.js"`)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ ES Module Export", async () => {
      const messages = await lintModule(`export default function greet() {}`)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Dynamic Import", async () => {
      const messages = await lintModule(`import("./greet.js")`)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Classes", async () => {
      const messages = await lint(`class Animal { constructor() {} }`)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Class Expressions", async () => {
      const messages = await lint(`const Animal = class { constructor() {} }`)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Computed Property Names", async () => {
      const messages = await lint(`
      var key = "dynamicKey"
      var obj = { [key]: "value" }
    `)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Object Rest/Spread", async () => {
      const messages = await lint(`
      const source = { a: 1, b: 2 }
      const copy = { ...source }
      module.exports = copy
    `)
      expect(hasErrors(messages)).toBe(true)
    })
  })

  describe("❌ Additional unsupported features", () => {
    test("❌ Promises", async () => {
      const messages = await lint(`
      const p = new Promise(function(resolve) { resolve(1) })
      module.exports = p
    `)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Generator Functions", async () => {
      const messages = await lint(`function* gen() { yield 1 }`)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Proxy", async () => {
      const messages = await lint(`
      const handler = { get: function() {} }
      const proxy = new Proxy({}, handler)
      module.exports = proxy
    `)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ Reflect API", async () => {
      const messages = await lint(`
      Reflect.get(obj, "key")
    `)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ RegExp u-Flag", async () => {
      const messages = await lint(`
      var regex = /test/u
    `)
      expect(hasErrors(messages)).toBe(true)
    })

    test("❌ RegExp y-Flag", async () => {
      const messages = await lint(`
      var regex = /test/y
    `)
      expect(hasErrors(messages)).toBe(true)
    })
  })
})

describe("📁 Folder Path Handling", () => {
  test("📁 client folder files are ignored", async () => {
    const messages = await lint(
      `class InvalidInOtherFolders {}`,
      "cartridges/app_sfra/cartridge/client/default/js/app.js",
    )
    // Should not error because client folder is ignored
    expect(hasErrors(messages)).toBe(false)
  })

  test("📁 static folder files are ignored", async () => {
    const messages = await lint(
      `class InvalidInOtherFolders {}`,
      "cartridges/app_sfra/cartridge/static/default/js/app.js",
    )
    // Should not error because static folder is ignored
    expect(hasErrors(messages)).toBe(false)
  })

  test("📁 script folder files are checked", async () => {
    const messages = await lint(
      `class ShouldError {}`,
      "cartridges/app_sfra/cartridge/scripts/product.js",
    )
    // Should error because scripts folder is not ignored
    expect(hasErrors(messages)).toBe(true)
  })

  test("📁 controller folder files are checked", async () => {
    const messages = await lint(
      `class ShouldError {}`,
      "cartridges/app_sfra/cartridge/controllers/Product.js",
    )
    // Should error because controllers folder is not ignored
    expect(hasErrors(messages)).toBe(true)
  })
})
