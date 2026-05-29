import type { Rule } from "eslint"

import { withSfccSettings } from "../_utils/sfcc-settings.js"

type AstNode = { type: string; [key: string]: unknown }

function isAstNode(value: unknown): value is AstNode {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    typeof (value as { type?: unknown }).type === "string"
  )
}

function hasDynamicJsxParts(root: Rule.Node): boolean {
  const stack: AstNode[] = [root as unknown as AstNode]
  const seen = new Set<AstNode>()

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node || seen.has(node)) {
      continue
    }

    seen.add(node)

    if (
      node.type === "JSXExpressionContainer" ||
      node.type === "JSXSpreadAttribute" ||
      node.type === "JSXSpreadChild"
    ) {
      return true
    }

    const entries = Object.entries(node)
    for (const [key, value] of entries) {
      if (key === "parent" || value === null || value === undefined) {
        continue
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          if (isAstNode(item)) {
            stack.push(item)
          }
        }
        continue
      }

      if (isAstNode(value)) {
        stack.push(value)
      }
    }
  }

  return false
}

function toXmlSuggestionText(markup: string): string {
  const canUseTemplateLiteral =
    markup.includes("\n") && !markup.includes("`") && !markup.includes("${")

  if (canUseTemplateLiteral) {
    return `XML(\`${markup}\`)`
  }

  return `XML(${JSON.stringify(markup)})`
}

const noE4xSyntax: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow JSX/E4X-like syntax in SFCC JavaScript to avoid parser ambiguity and unsupported runtime patterns.",
      recommended: true,
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      forbiddenSyntax:
        "JSX/E4X-like syntax is not allowed in SFCC JavaScript. Use plain JavaScript and SFCC XML APIs instead.",
      suggestXmlCtor: 'Convert static markup to XML("...") for explicit XML construction.',
    },
  },
  create: withSfccSettings((context) => {
    return {
      JSXElement(node: Rule.Node) {
        const isDynamic = hasDynamicJsxParts(node)

        context.report({
          node,
          messageId: "forbiddenSyntax",
          ...(isDynamic
            ? {}
            : {
                suggest: [
                  {
                    messageId: "suggestXmlCtor",
                    fix: (fixer) =>
                      fixer.replaceText(
                        node,
                        toXmlSuggestionText(context.sourceCode.getText(node)),
                      ),
                  },
                ],
              }),
        })
      },
      JSXFragment(node: Rule.Node) {
        context.report({ node, messageId: "forbiddenSyntax" })
      },
    }
  }),
}

export default noE4xSyntax
