import type { Rule } from "eslint"

type NodeWithParent = Rule.Node & { parent?: Rule.Node | null }

const FUNCTION_NODE_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
])

function isFunctionBodyBlock(node: NodeWithParent): boolean {
  const parent = node.parent as (Rule.Node & { body?: Rule.Node }) | null | undefined
  if (!parent) {
    return false
  }

  return FUNCTION_NODE_TYPES.has(parent.type) && parent.body === node
}

/**
 * Returns true when a VariableDeclaration node sits in a block-scoped context
 * where Rhino's const implementation is broken — i.e. const would not behave
 * like standard ES6 but like a function-scoped var.
 *
 * Affected contexts (see https://github.com/mozilla/rhino/issues/326):
 *  - Any BlockStatement that is NOT the direct body of a function
 *    (nested if/else, try/catch, switch-case blocks, …)
 *  - The left-hand side of for-in / for-of statements
 *  - The init position of a standard for-loop
 */
export function isRhinoCriticalScope(node: Rule.Node): boolean {
  const parent = (node as NodeWithParent).parent
  if (!parent) {
    return false
  }

  if (parent.type === "Program") {
    return false
  }

  if (parent.type === "BlockStatement") {
    return !isFunctionBodyBlock(parent as NodeWithParent)
  }

  return (
    parent.type === "ForStatement" ||
    parent.type === "ForInStatement" ||
    parent.type === "ForOfStatement" ||
    parent.type === "SwitchCase"
  )
}
