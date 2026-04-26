import type { Linter } from "eslint"

import recommended, { createRecommendedConfig } from "./configs/recommended.js"

const configs: { recommended: Linter.Config[] } = {
  recommended,
}

const sfcc: { configs: typeof configs } = {
  configs,
}

export { configs, recommended }
export { createRecommendedConfig }
export default sfcc
