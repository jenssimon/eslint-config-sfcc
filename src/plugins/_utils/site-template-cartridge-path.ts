import { XMLParser } from "fast-xml-parser"
import fs from "node:fs"
import path from "node:path"

function resolveSiteTemplateXmlPath(
  siteTemplatePath: string | undefined,
  site: string | undefined,
  cwd: string,
): string | undefined {
  if (!siteTemplatePath || !site) {
    return undefined
  }

  const resolvedSiteTemplatePath = path.isAbsolute(siteTemplatePath)
    ? siteTemplatePath
    : path.resolve(cwd, siteTemplatePath)

  return path.join(resolvedSiteTemplatePath, "sites", site, "site.xml")
}

function findCustomCartridges(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findCustomCartridges(item)
      if (found) {
        return found
      }
    }
    return undefined
  }

  const objectValue = value as Record<string, unknown>
  const directValue = objectValue["custom-cartridges"]
  if (typeof directValue === "string") {
    return directValue
  }

  for (const nestedValue of Object.values(objectValue)) {
    const found = findCustomCartridges(nestedValue)
    if (found) {
      return found
    }
  }

  return undefined
}

export function getSiteTemplateCartridgePath(
  siteTemplatePath: string | undefined,
  site: string | undefined,
  cwd: string,
): string[] {
  const siteTemplateXmlPath = resolveSiteTemplateXmlPath(siteTemplatePath, site, cwd)
  if (!siteTemplateXmlPath) {
    return []
  }

  try {
    const xmlContent = fs.readFileSync(siteTemplateXmlPath, "utf8")
    const parser = new XMLParser({
      ignoreAttributes: true,
      trimValues: true,
      parseTagValue: false,
      parseAttributeValue: false,
    })
    const parsed = parser.parse(xmlContent) as unknown
    const customCartridges = findCustomCartridges(parsed)

    if (!customCartridges) {
      return []
    }

    return customCartridges
      .split(":")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  } catch {
    return []
  }
}
