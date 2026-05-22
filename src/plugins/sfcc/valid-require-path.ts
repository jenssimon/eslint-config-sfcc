import type { Rule } from "eslint"

import fs from "node:fs"
import path from "node:path"

type RuleOptions = {
  allowBareModules?: string[]
  checkCartridgeExists?: boolean
  cartridgesDir?: string
}

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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidPath:
        'Invalid require path "{{requirePath}}". Allowed: dw/*, cartridgeName/*, ./*, ../*, */*, ~/* or configured bare modules.',
      unknownCartridge:
        'Unknown cartridge "{{cartridgeName}}" in require path "{{requirePath}}" (checked in "{{cartridgesDir}}/").',
    },
  },
  create: (context) => {
    const options = (context.options[0] ?? {}) as RuleOptions
    const allowBareModules = new Set(options.allowBareModules ?? ["server"])
    const checkCartridgeExists = options.checkCartridgeExists === true
    const cartridgesDir = options.cartridgesDir ?? "cartridges"
    const cwd =
      (context as Rule.RuleContext & { cwd?: string }).cwd ??
      (context as Rule.RuleContext & { getCwd?: () => string }).getCwd?.() ??
      process.cwd()

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
