import type { Linter } from "eslint"

import recommended, { createRecommendedConfig } from "./configs/recommended.js"
import sitegenesis from "./plugins/sitegenesis/index.js"

const configs: { recommended: Linter.Config[] } = {
  recommended,
}

const plugins = {
  sitegenesis,
}

const sfcc: { configs: typeof configs; plugins: typeof plugins } = {
  configs,
  plugins,
}

export { configs, plugins, recommended, sitegenesis }
export { createRecommendedConfig }
export default sfcc
