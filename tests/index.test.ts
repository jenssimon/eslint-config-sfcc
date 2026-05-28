import { expect, test } from "vite-plus/test"

import eslintConfigSfcc, {
  configs,
  createRecommendedConfig,
  plugins,
  recommended,
  sfcc,
  sitegenesis,
} from "../src/index.js"

test("exports a recommended flat config", () => {
  expect(Array.isArray(recommended)).toBe(true)
  expect(recommended.length).toBeGreaterThan(0)
})

test("exposes configs.recommended on default export", () => {
  expect(eslintConfigSfcc.configs.recommended).toBe(recommended)
})

test("named configs export equals default configs", () => {
  expect(configs).toBe(eslintConfigSfcc.configs)
})

test("exports createRecommendedConfig helper", () => {
  const createdConfig = createRecommendedConfig()
  expect(Array.isArray(createdConfig)).toBe(true)
  expect(createdConfig).toEqual(recommended)
})

test("accepts cartridgesDir with trailing slash", () => {
  const createdConfig = createRecommendedConfig({ cartridgesDir: "cartridges/" })
  expect(createdConfig).toEqual(recommended)
})

test("forwards shared sfcc options via settings", () => {
  const createdConfig = createRecommendedConfig({
    cartridgesDir: "custom-cartridges",
    sfcc: {
      checkCartridgeExists: true,
      cartridgePath: ["app_storefront", "modules"],
    },
  })

  expect(createdConfig[0]?.settings).toEqual({
    sfcc: {
      checkCartridgeExists: true,
      cartridgePath: ["app_storefront", "modules"],
      cartridgesDir: "custom-cartridges",
    },
  })
  expect(createdConfig[0]?.rules?.["sfcc/valid-require-path"]).toBe("error")
})

test("exports sitegenesis plugin", () => {
  expect(sitegenesis).toBe(plugins.sitegenesis)
})

test("exports sfcc plugin", () => {
  expect(sfcc).toBe(plugins.sfcc)
})

test("exposes plugins on default export", () => {
  expect(eslintConfigSfcc.plugins).toBe(plugins)
  expect(eslintConfigSfcc.plugins.sfcc).toBe(sfcc)
  expect(eslintConfigSfcc.plugins.sitegenesis).toBe(sitegenesis)
})
