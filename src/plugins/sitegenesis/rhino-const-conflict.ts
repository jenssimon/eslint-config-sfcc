import type { Rule } from "eslint"

import { isInNestedBlock } from "../_utils/rhino-scope.js"

interface FuncScope {
  /** All const declarations per identifier name (function-level + nested). */
  allConsts: Map<string, Rule.Node[]>
  /** Only the const declarations that are inside nested blocks. */
  nestedConsts: Map<string, Rule.Node[]>
}

const rhinoConstConflict: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow const in nested blocks when the same identifier is declared as const elsewhere in the same function, as Rhino treats const as function-scoped and would throw a re-declaration error.",
      recommended: true,
    },
    fixable: "code",
    schema: [],
    messages: {
      conflict:
        "'{{name}}' is declared as const in multiple block scopes of the same function. Use let to avoid a Rhino re-declaration error.",
    },
  },
  create: (context) => {
    const stack: FuncScope[] = []

    function enterFunction(): void {
      stack.push({ allConsts: new Map(), nestedConsts: new Map() })
    }

    function exitFunction(): void {
      const scope = stack.pop()
      if (!scope) return

      for (const [name, nestedNodes] of scope.nestedConsts) {
        if ((scope.allConsts.get(name)?.length ?? 0) > 1) {
          for (const node of nestedNodes) {
            context.report({
              node,
              messageId: "conflict",
              data: { name },
              fix: (fixer) => {
                const token = context.sourceCode.getFirstToken(node)
                if (!token || token.value !== "const") return null
                return fixer.replaceText(token, "let")
              },
            })
          }
        }
      }
    }

    return {
      FunctionDeclaration: enterFunction,
      FunctionExpression: enterFunction,
      ArrowFunctionExpression: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      "FunctionExpression:exit": exitFunction,
      "ArrowFunctionExpression:exit": exitFunction,

      VariableDeclaration(rawNode) {
        if (rawNode.kind !== "const" || stack.length === 0) return

        const node = rawNode as Rule.Node
        const scope = stack[stack.length - 1]
        const nested = isInNestedBlock(node)
        const variables = context.sourceCode.getDeclaredVariables(rawNode)

        for (const variable of variables) {
          const { name } = variable

          if (!scope.allConsts.has(name)) scope.allConsts.set(name, [])
          scope.allConsts.get(name)!.push(node)

          if (nested) {
            if (!scope.nestedConsts.has(name)) scope.nestedConsts.set(name, [])
            scope.nestedConsts.get(name)!.push(node)
          }
        }
      },
    }
  },
}

export default rhinoConstConflict
