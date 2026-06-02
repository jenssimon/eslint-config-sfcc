import type { Rule } from "eslint"

import { withSfccSettings } from "../_utils/sfcc-settings.js"

const LEGACY_RHINO_IMPORTS = new Set(["importScript", "importPackage", "importClass"])

function isJavaScriptTarget(filename: string): boolean {
  if (filename === "<input>") {
    return true
  }

  return /\.(?:[cm]?js|ds)$/iu.test(filename)
}

const noRhinoImportGlobals: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow legacy Rhino globals importScript, importPackage, and importClass in JavaScript files. Use CommonJS require() instead.",
      recommended: true,
    },
    schema: [],
    messages: {
      forbiddenLegacyImport: "{{name}}() is a legacy Rhino global. Use CommonJS require() instead.",
    },
  },
  create: withSfccSettings((context) => {
    if (!isJavaScriptTarget(context.filename)) {
      return {}
    }

    return {
      CallExpression(node: Rule.Node) {
        const callExpression = node as Rule.Node & {
          callee: Rule.Node & { type?: string; name?: string }
        }
        const callee = callExpression.callee

        if (callee.type !== "Identifier" || !LEGACY_RHINO_IMPORTS.has(callee.name ?? "")) {
          return
        }

        context.report({
          node: callee,
          messageId: "forbiddenLegacyImport",
          data: { name: callee.name },
        })
      },
    }
  }),
}

export default noRhinoImportGlobals
