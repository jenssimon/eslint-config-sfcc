import type { Rule, Scope } from "eslint"

type RequireEntry = {
  variable: Scope.Variable
  useCount: number
  usedGlobally: boolean
}

function getParserGlobalReturn(context: Rule.RuleContext): boolean {
  const parserOptions = (
    context as unknown as {
      parserOptions?: { ecmaFeatures?: { globalReturn?: boolean } }
    }
  ).parserOptions

  return Boolean(parserOptions?.ecmaFeatures?.globalReturn)
}

function getGlobalScope(context: Rule.RuleContext, node: Rule.Node): Scope.Scope {
  const scope = context.sourceCode.getScope(node)
  const hasGlobalReturn = getParserGlobalReturn(context)
  const sourceType = (node as { sourceType?: string }).sourceType

  if (hasGlobalReturn || sourceType === "module" || sourceType === "commonjs") {
    return scope.childScopes[0] ?? scope
  }

  return scope
}

function isReadOnlyVariable(variable: Scope.Variable): boolean {
  return (variable as Scope.Variable & { writeable?: unknown }).writeable === undefined
}

function getRequireCalleeName(variable: Scope.Variable): string | undefined {
  const definition = variable.defs[0]
  const declarationNode = definition?.node as {
    init?: { callee?: { name?: string } }
  }

  return declarationNode.init?.callee?.name
}

function getReportNode(variable: Scope.Variable): Rule.Node | undefined {
  const identifierNode = variable.identifiers[0]
  if (identifierNode) {
    return identifierNode as unknown as Rule.Node
  }

  return variable.defs[0]?.node as unknown as Rule.Node | undefined
}

const noGlobalRequire: Rule.RuleModule = {
  meta: {
    docs: {
      description: "Prohibites global use of require unless every function is using it.",
      recommended: true,
    },
    schema: [],
  },
  create: (context) => {
    const normalizedFilename = context.filename.replaceAll("\\", "/")
    if (!normalizedFilename.includes("/cartridge/controllers/")) {
      return {}
    }

    let routeCount = 0
    const requires: Record<string, RequireEntry> = {}

    function processFunction(node: Rule.Node): void {
      const scope = context.sourceCode.getScope(node)

      // Only count direct (top-level) route functions, not nested callbacks or helpers.
      // A function is top-level when its enclosing scope's block is the Program node.
      if (scope.upper?.block?.type !== "Program") {
        return
      }

      routeCount += 1

      scope.through
        .filter((item) => item.from.type === "function")
        .forEach((item) => {
          const requireItem = requires[item.identifier.name]
          if (requireItem) {
            requireItem.useCount += 1
          }
        })
    }

    return {
      Program(node) {
        const globalScope = getGlobalScope(context, node as Rule.Node)

        globalScope.variables
          .filter(isReadOnlyVariable)
          .filter((item) => item.name !== "arguments")
          .forEach((item) => {
            const isRequire = getRequireCalleeName(item) === "require"
            const usedGlobally = globalScope.references.some(
              (ref) => !ref.init && ref.identifier.name === item.name,
            )

            if (isRequire) {
              requires[item.name] = {
                variable: item,
                useCount: 0,
                usedGlobally,
              }
            }
          })
      },
      FunctionExpression(node) {
        processFunction(node as Rule.Node)
      },
      FunctionDeclaration(node) {
        processFunction(node as Rule.Node)
      },
      "Program:exit"() {
        Object.keys(requires).forEach((key) => {
          const value = requires[key]
          const reportNode = value ? getReportNode(value.variable) : undefined
          if (value && reportNode && value.useCount < routeCount && !value.usedGlobally) {
            context.report({
              node: reportNode,
              message: '"{{a}}" should be declared inside route',
              data: { a: key },
            })
          }
        })
      },
    }
  },
}

export default noGlobalRequire
