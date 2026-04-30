import type { Rule, Scope } from "eslint"

type RequireUsage = {
  node: Rule.Node
  functionScopes: Set<unknown>
  usedGlobally: boolean
}

type ProgramStatement = {
  type: string
  declarations?: Array<{
    id: { type: string; name: string }
    init: unknown
  }>
}

function findProgramScope(
  sourceCode: Rule.RuleContext["sourceCode"],
  node: Rule.Node,
): Scope.Scope {
  const globalScope = sourceCode.getScope(node)

  // In CommonJS/flat-config, top-level variables live in a module/program
  // child scope whose block is the same Program node.
  for (const scope of sourceCode.scopeManager.scopes) {
    if (scope !== globalScope && scope.block === node && scope.type !== "global") {
      return scope
    }
  }

  return globalScope.childScopes.find((scope) => scope.block === node) ?? globalScope
}

/**
 * Returns true when `node` is the identifier in `var x = requireResult.method(…)`,
 * where the whole variable declaration is at the top level of a Program.
 * These are considered "globally consumed" and should not trigger a report.
 */
function isTopLevelVariableInitializer(node: Rule.Node): boolean {
  const parent = (node as { parent?: Rule.Node }).parent
  if (!parent || parent.type !== "MemberExpression") {
    return false
  }

  const call = (parent as { parent?: Rule.Node }).parent
  if (!call || call.type !== "CallExpression") {
    return false
  }

  const declarator = (call as { parent?: Rule.Node }).parent
  if (
    !declarator ||
    declarator.type !== "VariableDeclarator" ||
    (declarator as { init?: unknown }).init !== call
  ) {
    return false
  }

  const declaration = (declarator as { parent?: Rule.Node }).parent
  if (!declaration || declaration.type !== "VariableDeclaration") {
    return false
  }

  return (declaration as { parent?: Rule.Node }).parent?.type === "Program"
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

        // Walk the program body directly instead of relying on the scope manager.
        // @typescript-eslint/parser may not populate programScope.variables for
        // const/let declarations, so AST traversal is the only parser-agnostic way.
        for (const statement of (node as unknown as { body: ProgramStatement[] }).body) {
          if (statement.type !== "VariableDeclaration") {
            continue
          }

          for (const declarator of statement.declarations ?? []) {
            if (declarator.id.type !== "Identifier") {
              continue
            }

            if (!isRequireInitializer(declarator.init)) {
              continue
            }

            requires[declarator.id.name] = {
              node: declarator.id as unknown as Rule.Node,
              functionScopes: new Set(),
              usedGlobally: false,
            }
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
      Identifier(node) {
        const { name } = node as unknown as { name: string }
        const usage = requires[name]
        if (!usage) {
          return
        }

        const parent = (node as unknown as { parent?: Rule.Node }).parent

        // Skip the declaration itself: VariableDeclarator.id = node
        if (parent?.type === "VariableDeclarator" && (parent as { id?: unknown }).id === node) {
          return
        }

        // Top-level usage that derives a new variable is globally useful —
        // e.g. `var homeUrl = URLUtils.url("Home-Show")` at program level.
        if (isTopLevelVariableInitializer(node as Rule.Node)) {
          usage.usedGlobally = true
          return
        }

        const scope = context.sourceCode.getScope(node as Rule.Node)

        // In CommonJS, top-level code runs inside a module-wrapper function
        // (programScope). References at that level are NOT inside a user-defined
        // route function — only references inside child function scopes count.
        if (scope.type === "function" && scope !== programScope) {
          usage.functionScopes.add(scope.block)
        }
      },
      "Program:exit"() {
        // Nothing to report when there are no route functions.
        if (routeCount === 0) {
          return
        }

        for (const [name, usage] of Object.entries(requires)) {
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
