import { expect, test } from "vite-plus/test"

import sfcc, { configs, createRecommendedConfig, recommended } from "../src/index.js"

test("exports a recommended flat config", () => {
  expect(Array.isArray(recommended)).toBe(true)
  expect(recommended.length).toBeGreaterThan(0)
})

test("exposes configs.recommended on default export", () => {
  expect(sfcc.configs.recommended).toBe(recommended)
})

test("named configs export equals default configs", () => {
  expect(configs).toBe(sfcc.configs)
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
