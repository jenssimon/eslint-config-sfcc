import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { expect, test } from "vite-plus/test"

import { getSiteTemplateCartridgePath } from "../src/plugins/_utils/site-template-cartridge-path.js"

function createTempTemplatePath(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sfcc-site-template-"))
}

test("returns empty when siteTemplatePath is missing", () => {
  const result = getSiteTemplateCartridgePath(undefined, "example", process.cwd())
  expect(result).toEqual([])
})

test("returns empty when site is missing", () => {
  const result = getSiteTemplateCartridgePath("sites/site_template", undefined, process.cwd())
  expect(result).toEqual([])
})

test("reads custom-cartridges from conventional site template path", () => {
  const templatePath = createTempTemplatePath()
  const site = "example"
  const siteXmlPath = path.join(templatePath, "sites", site, "site.xml")

  fs.mkdirSync(path.dirname(siteXmlPath), { recursive: true })

  try {
    fs.writeFileSync(
      siteXmlPath,
      "<site><custom-cartridges>app_base: app_custom :int_payments:: </custom-cartridges></site>",
    )

    const result = getSiteTemplateCartridgePath(templatePath, site, process.cwd())
    expect(result).toEqual(["app_base", "app_custom", "int_payments"])
  } finally {
    fs.rmSync(templatePath, { recursive: true, force: true })
  }
})

test("returns empty when site.xml has no custom-cartridges", () => {
  const templatePath = createTempTemplatePath()
  const site = "example"
  const siteXmlPath = path.join(templatePath, "sites", site, "site.xml")

  fs.mkdirSync(path.dirname(siteXmlPath), { recursive: true })

  try {
    fs.writeFileSync(siteXmlPath, "<site><name>Example</name></site>")

    const result = getSiteTemplateCartridgePath(templatePath, site, process.cwd())
    expect(result).toEqual([])
  } finally {
    fs.rmSync(templatePath, { recursive: true, force: true })
  }
})
