import type { Rule, Scope } from "eslint"

import { isInNestedBlock, isRhinoCriticalScope } from "../_utils/rhino-scope.js"

function isNeverReassigned(variable: Scope.Variable): boolean {
  // A variable is "never reassigned" if all its write references are the
  // initializer (ref.init === true). This mirrors the core prefer-const logic.
  return variable.references.every((ref) => !ref.isWrite() || ref.init === true)
}

const preferConst: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require const for let declarations that are never reassigned, " +
        "except in Rhino-sensitive nested and loop scopes.",
      recommended: true,
    },
    fixable: "code",
    schema: [],
    messages: {
      useConst: "Prefer const over let when the variable is never reassigned.",
    },
  },
  create: (context) => ({
    "VariableDeclaration[kind='let']"(node: Rule.Node) {
      // In Rhino-critical scopes const is broken — don't suggest it here.
      // In any nested block, const might cause Rhino re-declaration conflicts.
      // Also skip loop headers where rhino-const-compat already handles const→let.
      if (isInNestedBlock(node) || isRhinoCriticalScope(node)) {
        return
      }

      const variables = context.sourceCode.getDeclaredVariables(node)
      if (variables.length === 0 || !variables.every(isNeverReassigned)) {
        return
      }

      context.report({
        node: node,
        messageId: "useConst",
        fix: (fixer) => {
          const keywordToken = context.sourceCode.getFirstToken(node)
          if (!keywordToken || keywordToken.value !== "let") {
            return null
          }

          return fixer.replaceText(keywordToken, "const")
        },
      })
    },
  }),
}

export default preferConst
