import type { Rule } from "eslint"

import fs from "node:fs"
import path from "node:path"

type RuleOptions = {
  allowBareModules?: string[]
  checkCartridgeExists?: boolean
  cartridgesDir?: string
  cartridgePath?: string[]
}

const SUPPORTED_EXTENSIONS = ["js", "ds", "json"]

function getStringArgument(node: Rule.Node): string | undefined {
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value
  }

  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? undefined
  }

  return undefined
}

function isAllowedPrefix(requirePath: string): boolean {
  return (
    requirePath.startsWith("dw/") ||
    requirePath.startsWith("./") ||
    requirePath.startsWith("../") ||
    requirePath.startsWith("*/") ||
    requirePath.startsWith("~/")
  )
}

function isCartridgeStylePath(requirePath: string): boolean {
  return /^[A-Za-z0-9_-]+\/.+/u.test(requirePath)
}

function getFirstSegment(requirePath: string): string {
  const slashIndex = requirePath.indexOf("/")
  return slashIndex === -1 ? requirePath : requirePath.slice(0, slashIndex)
}

function resolveCartridgesDir(cartridgesDir: string, cwd: string): string {
  return path.isAbsolute(cartridgesDir) ? cartridgesDir : path.resolve(cwd, cartridgesDir)
}

function getConfiguredCartridgePath(cartridgePath: string[] | undefined): string[] {
  if (!cartridgePath) {
    return []
  }

  return cartridgePath.filter((entry) => entry.trim().length > 0)
}

function getFilesystemCartridges(cartridgesDir: string, cwd: string): string[] {
  const baseDir = resolveCartridgesDir(cartridgesDir, cwd)

  try {
    return fs
      .readdirSync(baseDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    return []
  }
}

function moduleExistsInCartridge(
  cartridgeName: string,
  moduleTarget: string,
  cartridgesDir: string,
  cwd: string,
): boolean {
  const baseDir = resolveCartridgesDir(cartridgesDir, cwd)
  const normalizedTarget = moduleTarget.replace(/^\/+/, "")
  const targetPath = path.join(baseDir, cartridgeName, normalizedTarget)

  if (path.extname(normalizedTarget)) {
    return fs.existsSync(targetPath)
  }

  return SUPPORTED_EXTENSIONS.some((extension) => fs.existsSync(`${targetPath}.${extension}`))
}

function getOwnCartridge(filename: string, cartridgesDir: string, cwd: string): string | undefined {
  if (filename === "<input>") {
    return undefined
  }

  const resolvedFilename = path.isAbsolute(filename) ? filename : path.resolve(cwd, filename)
  const baseDir = resolveCartridgesDir(cartridgesDir, cwd)
  const relativePath = path.relative(baseDir, resolvedFilename)

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return undefined
  }

  const firstSegment = relativePath.split(path.sep)[0]
  return firstSegment && firstSegment !== "." ? firstSegment : undefined
}

function starReferenceExists(
  requirePath: string,
  cartridgesDir: string,
  cwd: string,
  configuredCartridgePath: string[],
): boolean {
  const moduleTarget = requirePath.slice(2)
  if (!moduleTarget) {
    return false
  }

  const cartridgeNames =
    configuredCartridgePath.length > 0
      ? configuredCartridgePath
      : getFilesystemCartridges(cartridgesDir, cwd)

  return cartridgeNames.some((name) =>
    moduleExistsInCartridge(name, moduleTarget, cartridgesDir, cwd),
  )
}

function tildeReferenceExists(
  requirePath: string,
  filename: string,
  cartridgesDir: string,
  cwd: string,
): boolean {
  const moduleTarget = requirePath.slice(2)
  if (!moduleTarget) {
    return false
  }

  const ownCartridge = getOwnCartridge(filename, cartridgesDir, cwd)
  if (!ownCartridge) {
    return false
  }

  return moduleExistsInCartridge(ownCartridge, moduleTarget, cartridgesDir, cwd)
}

function cartridgeExists(cartridgeName: string, cartridgesDir: string, cwd: string): boolean {
  const baseDir = resolveCartridgesDir(cartridgesDir, cwd)
  const cartridgeRoot = path.join(baseDir, cartridgeName)

  try {
    return fs.statSync(cartridgeRoot).isDirectory()
  } catch {
    return false
  }
}

const validRequirePath: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce SFCC-compatible require paths (dw/, relative, cartridge-name/, */, ~/).",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowBareModules: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          checkCartridgeExists: { type: "boolean" },
          cartridgesDir: { type: "string" },
          cartridgePath: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidPath:
        'Invalid require path "{{requirePath}}". Allowed: dw/*, cartridgeName/*, ./*, ../*, */*, ~/* or configured bare modules.',
      unknownCartridge:
        'Unknown cartridge "{{cartridgeName}}" in require path "{{requirePath}}" (checked in "{{cartridgesDir}}/").',
      unresolvedStarPath:
        'Cannot resolve "{{requirePath}}" against configured cartridges in "{{cartridgesDir}}/".',
      unresolvedTildePath:
        'Cannot resolve "{{requirePath}}" in current cartridge (checked in "{{cartridgesDir}}/").',
    },
  },
  create: (context) => {
    const options = (context.options[0] ?? {}) as RuleOptions
    const allowBareModules = new Set(options.allowBareModules ?? ["server"])
    const checkCartridgeExists = options.checkCartridgeExists === true
    const cartridgesDir = options.cartridgesDir ?? "cartridges"
    const configuredCartridgePath = getConfiguredCartridgePath(options.cartridgePath)
    const cwd =
      (context as Rule.RuleContext & { cwd?: string }).cwd ??
      (context as Rule.RuleContext & { getCwd?: () => string }).getCwd?.() ??
      process.cwd()
    const filename =
      (context as Rule.RuleContext & { filename?: string }).filename ??
      (context as Rule.RuleContext & { getFilename?: () => string }).getFilename?.() ??
      "<input>"

    return {
      CallExpression(node) {
        const callNode = node as Rule.Node & {
          callee?: { type?: string; name?: string }
          arguments?: Rule.Node[]
        }

        if (callNode.callee?.type !== "Identifier" || callNode.callee.name !== "require") {
          return
        }

        const firstArgument = callNode.arguments?.[0]
        if (!firstArgument) {
          return
        }

        const requirePath = getStringArgument(firstArgument)
        if (!requirePath) {
          return
        }

        if (requirePath.startsWith("*/")) {
          if (
            checkCartridgeExists &&
            !starReferenceExists(requirePath, cartridgesDir, cwd, configuredCartridgePath)
          ) {
            context.report({
              node: firstArgument,
              messageId: "unresolvedStarPath",
              data: { requirePath, cartridgesDir },
            })
          }
          return
        }

        if (requirePath.startsWith("~/")) {
          if (
            checkCartridgeExists &&
            !tildeReferenceExists(requirePath, filename, cartridgesDir, cwd)
          ) {
            context.report({
              node: firstArgument,
              messageId: "unresolvedTildePath",
              data: { requirePath, cartridgesDir },
            })
          }
          return
        }

        if (isAllowedPrefix(requirePath)) {
          return
        }

        if (!requirePath.includes("/")) {
          if (!allowBareModules.has(requirePath)) {
            context.report({
              node: firstArgument,
              messageId: "invalidPath",
              data: { requirePath },
            })
          }
          return
        }

        if (!isCartridgeStylePath(requirePath)) {
          context.report({
            node: firstArgument,
            messageId: "invalidPath",
            data: { requirePath },
          })
          return
        }

        if (!checkCartridgeExists) {
          return
        }

        const cartridgeName = getFirstSegment(requirePath)
        if (!cartridgeExists(cartridgeName, cartridgesDir, cwd)) {
          context.report({
            node: firstArgument,
            messageId: "unknownCartridge",
            data: { cartridgeName, requirePath, cartridgesDir },
          })
        }
      },
    }
  },
}

export default validRequirePath
