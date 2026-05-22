import preferConst from "./prefer-const.js"
import rhinoConstCompat from "./rhino-const-compat.js"
import rhinoConstConflict from "./rhino-const-conflict.js"
import validRequirePath from "./valid-require-path.js"

const sfcc = {
  rules: {
    "prefer-const": preferConst,
    "rhino-const-compat": rhinoConstCompat,
    "rhino-const-conflict": rhinoConstConflict,
    "valid-require-path": validRequirePath,
  },
}

export default sfcc
