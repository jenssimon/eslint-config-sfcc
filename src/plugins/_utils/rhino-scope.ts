import type { Rule } from "eslint"

type NodeWithParent = Rule.Node & { parent?: Rule.Node | null }

export const FUNCTION_NODE_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
])

const LOOP_NODE_TYPES = new Set([
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
])

function isFunctionBodyBlock(node: NodeWithParent): boolean {
  const parent = node.parent as (Rule.Node & { body?: Rule.Node }) | null | undefined
  if (!parent) {
    return false
  }

  return FUNCTION_NODE_TYPES.has(parent.type) && parent.body === node
}

function hasLoopAncestor(node: NodeWithParent): boolean {
  let current = node.parent as NodeWithParent | null | undefined
  while (current) {
    if (LOOP_NODE_TYPES.has(current.type)) return true
    if (FUNCTION_NODE_TYPES.has(current.type) || current.type === "Program") return false
    current = current.parent as NodeWithParent | null | undefined
  }
  return false
}

/**
 * Returns true when a VariableDeclaration node sits in a block-scoped context
 * where Rhino's const implementation is broken due to loop re-execution —
 * i.e. the same const binding would be re-declared on each iteration.
 *
 * Affected contexts (see https://github.com/mozilla/rhino/issues/326):
 *  - The left-hand side of for-in / for-of statements
 *  - The init position of a standard for-loop
 *  - Any BlockStatement that has a loop ancestor within the same function
 *  - SwitchCase (iterated via fall-through semantics in Rhino)
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
    if (isFunctionBodyBlock(parent as NodeWithParent)) return false
    return hasLoopAncestor(node as NodeWithParent)
  }

  return (
    parent.type === "ForStatement" ||
    parent.type === "ForInStatement" ||
    parent.type === "ForOfStatement" ||
    parent.type === "SwitchCase"
  )
}

/**
 * Returns true when a VariableDeclaration node is inside a nested block
 * (any BlockStatement that is NOT the direct body of a function).
 * Used to detect potential same-name const conflicts across sibling blocks.
 */
export function isInNestedBlock(node: Rule.Node): boolean {
  const parent = (node as NodeWithParent).parent
  if (!parent || parent.type !== "BlockStatement") {
    return false
  }
  return !isFunctionBodyBlock(parent as NodeWithParent)
}
