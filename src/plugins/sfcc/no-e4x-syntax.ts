import type { Rule } from "eslint"

import { withSfccSettings } from "../_utils/sfcc-settings.js"

const noE4xSyntax: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow JSX/E4X-like syntax in SFCC JavaScript to avoid parser ambiguity and unsupported runtime patterns.",
      recommended: true,
    },
    schema: [],
    messages: {
      forbiddenSyntax:
        "JSX/E4X-like syntax is not allowed in SFCC JavaScript. Use plain JavaScript and SFCC XML APIs instead.",
    },
  },
  create: withSfccSettings((context) => {
    return {
      JSXElement(node: Rule.Node) {
        context.report({ node, messageId: "forbiddenSyntax" })
      },
      JSXFragment(node: Rule.Node) {
        context.report({ node, messageId: "forbiddenSyntax" })
      },
    }
  }),
}

export default noE4xSyntax
