import type { Rule, Scope } from "eslint"

type RequireUsage = {
  node: unknown
  variable: Scope.Variable
  functionScopes: Set<unknown>
  usedGlobally: boolean
}

function isRequireInitializer(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false
  }

  const node = value as {
    type?: string
    callee?: { type?: string; name?: string }
  }

  return (
    node.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    node.callee.name === "require"
  )
}

const noGlobalRequire: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow global require usage unless every function depends on it.",
      recommended: false,
    },
    schema: [],
    messages: {
      moveInsideRoute: '"{{name}}" should be declared inside route',
    },
  },
  create: (context) => {
    const normalizedFilename = context.filename.replaceAll("\\", "/")
    if (!normalizedFilename.includes("/cartridge/controllers/")) {
      return {}
    }

    let routeCount = 0
    const requires: Record<string, RequireUsage> = {}

    return {
      FunctionExpression() {
        routeCount += 1
      },
      FunctionDeclaration() {
        routeCount += 1
      },
      Program(node) {
        const topScope = context.sourceCode.getScope(node)
        const candidateScopes = context.sourceCode.scopeManager.scopes.filter(
          (scope) => scope === topScope || scope.upper === topScope,
        )

        for (const scope of candidateScopes) {
          for (const variable of scope.variables) {
            if (variable.name === "arguments") {
              continue
            }

            const definition = variable.defs[0]
            if (!definition) {
              continue
            }

            const initNode = "init" in definition.node ? definition.node.init : undefined
            if (!isRequireInitializer(initNode)) {
              continue
            }

            const identifier = variable.identifiers[0]
            if (!identifier) {
              continue
            }

            requires[variable.name] = {
              node: identifier,
              variable,
              functionScopes: new Set(),
              usedGlobally: false,
            }
          }
        }
      },
      "Program:exit"() {
        const requiredFunctionUsages = routeCount === 0 ? 1 : routeCount

        for (const [name, usage] of Object.entries(requires)) {
          for (const reference of usage.variable.references) {
            if (reference.init) {
              continue
            }

            if (reference.from.type === "global" || reference.from.block.type === "Program") {
              usage.usedGlobally = true
              continue
            }

            if (reference.from.type === "function") {
              usage.functionScopes.add(reference.from.block)
            }
          }

          if (usage.functionScopes.size < requiredFunctionUsages && !usage.usedGlobally) {
            context.report({
              node: usage.node as Rule.Node,
              messageId: "moveInsideRoute",
              data: { name },
            })
          }
        }
      },
    }
  },
}

export default noGlobalRequire
