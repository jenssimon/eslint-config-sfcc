import type { Rule } from "eslint"

import { withSfccSettings } from "../_utils/sfcc-settings.js"

type TypeAnnotationNode = Rule.Node & {
  parent?: Rule.Node & {
    optional?: boolean
    definite?: boolean
    name?: string
    parent?: Rule.Node
  }
}

type CommentNode = {
  type: string
  value: string
}

type SourceCodeLike = {
  getCommentsBefore(node: Rule.Node): unknown[]
  getText(node: Rule.Node): string
}

function isJavaScriptTarget(filename: string): boolean {
  if (filename === "<input>") {
    return true
  }

  return /\.(?:[cm]?js|ds)$/iu.test(filename)
}

function canAutoFix(node: TypeAnnotationNode): boolean {
  const parent = node.parent
  if (!parent) {
    return false
  }

  if (
    parent.type === "FunctionDeclaration" ||
    parent.type === "FunctionExpression" ||
    parent.type === "ArrowFunctionExpression"
  ) {
    return true
  }

  if (parent.type !== "Identifier") {
    return false
  }

  // `foo?: Type` and `foo!: Type` cannot be fixed by removing only the type annotation.
  if (parent.optional === true || parent.definite === true) {
    return false
  }

  // `this: Type` parameters are TypeScript-specific and need manual migration.
  if (parent.name === "this") {
    return false
  }

  return true
}

function hasLeadingJsdoc(sourceCode: SourceCodeLike, node: Rule.Node): boolean {
  const comments = sourceCode.getCommentsBefore(node) as CommentNode[]
  return comments.some(
    (comment) => comment.type === "Block" && comment.value.trimStart().startsWith("*"),
  )
}

function getTypeText(sourceCode: SourceCodeLike, node: Rule.Node): string {
  return sourceCode.getText(node).replace(/^:\s*/u, "")
}

function getVariableDeclaration(node: TypeAnnotationNode): Rule.Node | undefined {
  const identifier = node.parent
  const declarator = identifier?.parent
  const declaration = declarator?.parent

  if (!identifier || identifier.type !== "Identifier") {
    return undefined
  }

  if (declarator?.type !== "VariableDeclarator" || declaration?.type !== "VariableDeclaration") {
    return undefined
  }

  if (
    declaration.declarations.length !== 1 ||
    declarator.id !== identifier ||
    declarator.init == null
  ) {
    return undefined
  }

  return declaration
}

function getFunctionNode(node: TypeAnnotationNode): Rule.Node | undefined {
  const parent = node.parent
  if (
    parent?.type === "FunctionDeclaration" ||
    parent?.type === "FunctionExpression" ||
    parent?.type === "ArrowFunctionExpression"
  ) {
    return parent
  }

  return undefined
}

const noTypeAnnotations: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow type-annotation syntax in JavaScript files. Rhino/E4X may accept it, but it is invalid in standard JavaScript. Use JSDoc types instead.",
      recommended: true,
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      forbiddenTypeAnnotation:
        "Type annotation syntax may be valid in Rhino/E4X, but is invalid in standard JavaScript and not allowed in .js files. Use JSDoc typing instead.",
      suggestJsdocType: "Add a JSDoc @type annotation and remove the inline type annotation.",
      suggestJsdocReturns: "Add a JSDoc @returns annotation and remove the inline type annotation.",
    },
  },
  create: withSfccSettings((context) => {
    if (!isJavaScriptTarget(context.filename)) {
      return {}
    }

    return {
      TSTypeAnnotation(rawNode: Rule.Node) {
        const node = rawNode as TypeAnnotationNode
        const sourceCode = context.sourceCode
        const variableDeclaration = getVariableDeclaration(node)
        const functionNode = getFunctionNode(node)
        const typeText = getTypeText(sourceCode, node)
        const shouldSuggestTypeJsdoc =
          variableDeclaration !== undefined && !hasLeadingJsdoc(sourceCode, variableDeclaration)
        const shouldSuggestReturnsJsdoc =
          functionNode !== undefined && !hasLeadingJsdoc(sourceCode, functionNode)

        context.report({
          node,
          messageId: "forbiddenTypeAnnotation",
          ...(canAutoFix(node)
            ? {
                fix: (fixer) => fixer.remove(node),
              }
            : {}),
          ...(shouldSuggestTypeJsdoc && variableDeclaration !== undefined
            ? {
                suggest: [
                  {
                    messageId: "suggestJsdocType",
                    fix: (fixer) => [
                      fixer.insertTextBefore(variableDeclaration, `/** @type {${typeText}} */\n`),
                      fixer.remove(node),
                    ],
                  },
                ],
              }
            : shouldSuggestReturnsJsdoc && functionNode !== undefined
              ? {
                  suggest: [
                    {
                      messageId: "suggestJsdocReturns",
                      fix: (fixer) => [
                        fixer.insertTextBefore(functionNode, `/** @returns {${typeText}} */\n`),
                        fixer.remove(node),
                      ],
                    },
                  ],
                }
              : {}),
        })
      },
    }
  }),
}

export default noTypeAnnotations
