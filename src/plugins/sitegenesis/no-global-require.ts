import type { Rule, Scope } from "eslint"

type RequireUsage = {
  node: unknown
  variable: Scope.Variable
  functionScopes: Set<unknown>
  usedGlobally: boolean
}

function findProgramScope(
  sourceCode: Rule.RuleContext["sourceCode"],
  node: Rule.Node,
): Scope.Scope {
  const globalScope = sourceCode.getScope(node)

  // In CommonJS/flat-config combinations, top-level variables can live either
  // in the global scope or in a dedicated module scope for the same Program.
  for (const scope of sourceCode.scopeManager.scopes) {
    if (scope !== globalScope && scope.block === node && scope.type !== "global") {
      return scope
    }
  }

  return (
    globalScope.childScopes.find((scope) => scope.block === node) ??
    globalScope.childScopes[0] ??
    globalScope
  )
}

function isTopLevelVariableInitializerReference(reference: Scope.Reference): boolean {
  const identifier = reference.identifier as Rule.Node & { parent?: Rule.Node }
  const parent = identifier.parent
  if (!parent || parent.type !== "MemberExpression") {
    return false
  }

  const call = parent.parent
  if (!call || call.type !== "CallExpression") {
    return false
  }

  const declarator = call.parent
  if (!declarator || declarator.type !== "VariableDeclarator" || declarator.init !== call) {
    return false
  }

  const declaration = declarator.parent
  if (!declaration || declaration.type !== "VariableDeclaration") {
    return false
  }

  return declaration.parent?.type === "Program"
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
      recommended: true,
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

    let programScope: Scope.Scope | null = null
    let routeCount = 0
    const requires: Record<string, RequireUsage> = {}

    return {
      Program(node) {
        programScope = findProgramScope(context.sourceCode, node as Rule.Node)

        // Only collect variables declared at the program/module top level.
        for (const variable of programScope.variables) {
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
      },
      FunctionExpression(node) {
        // Count only top-level route functions, not nested helpers.
        const scope = context.sourceCode.getScope(node)
        if (scope.upper === programScope) {
          routeCount += 1
        }
      },
      FunctionDeclaration(node) {
        const scope = context.sourceCode.getScope(node)
        if (scope.upper === programScope) {
          routeCount += 1
        }
      },
      "Program:exit"() {
        // Nothing to report when there are no route functions.
        if (routeCount === 0) {
          return
        }

        for (const [name, usage] of Object.entries(requires)) {
          for (const reference of usage.variable.references) {
            if (reference.init) {
              continue
            }

            if (
              reference.from.type === "global" ||
              isTopLevelVariableInitializerReference(reference)
            ) {
              usage.usedGlobally = true
              continue
            }

            if (reference.from === programScope) {
              continue
            }

            if (reference.from.type === "function") {
              usage.functionScopes.add(reference.from.block)
            }
          }

          if (usage.functionScopes.size < routeCount && !usage.usedGlobally) {
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
