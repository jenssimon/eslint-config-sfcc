import noGlobalRequire from "./no-global-require.js"
import preferConst from "./prefer-const.js"
import rhinoConstCompat from "./rhino-const-compat.js"

const sitegenesis = {
  rules: {
    "no-global-require": noGlobalRequire,
    "prefer-const": preferConst,
    "rhino-const-compat": rhinoConstCompat,
  },
}

export default sitegenesis
