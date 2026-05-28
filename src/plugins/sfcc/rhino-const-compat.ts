import type { Rule } from "eslint"

import { isRhinoCriticalScope } from "../_utils/rhino-scope.js"
import { withSfccSettings } from "../_utils/sfcc-settings.js"

function isRhinoCriticalConstDeclaration(node: Rule.Node): boolean {
  return node.type === "VariableDeclaration" && node.kind === "const" && isRhinoCriticalScope(node)
}

const rhinoConstCompat: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce let instead of const in Rhino-unsafe loop-related scopes.",
      recommended: true,
    },
    fixable: "code",
    schema: [],
    messages: {
      useLet: "Use let instead of const in this block-scoped context for Rhino compatibility.",
    },
  },
  create: withSfccSettings((context) => ({
    VariableDeclaration(node) {
      if (!isRhinoCriticalConstDeclaration(node as Rule.Node)) {
        return
      }

      context.report({
        node: node as Rule.Node,
        messageId: "useLet",
        fix: (fixer) => {
          const keywordToken = context.sourceCode.getFirstToken(node as Rule.Node)
          if (!keywordToken || keywordToken.value !== "const") {
            return null
          }

          return fixer.replaceText(keywordToken, "let")
        },
      })
    },
  })),
}

export default rhinoConstCompat
