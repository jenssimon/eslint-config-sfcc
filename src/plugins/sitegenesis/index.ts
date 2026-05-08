import noGlobalRequire from "./no-global-require.js"
import preferConst from "./prefer-const.js"
import rhinoConstCompat from "./rhino-const-compat.js"
import rhinoConstConflict from "./rhino-const-conflict.js"

const sitegenesis = {
  rules: {
    "no-global-require": noGlobalRequire,
    "prefer-const": preferConst,
    "rhino-const-compat": rhinoConstCompat,
    "rhino-const-conflict": rhinoConstConflict,
  },
}

export default sitegenesis
