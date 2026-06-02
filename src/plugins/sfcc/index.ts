import noDsFiles from "./no-ds-files.js"
import noE4xSyntax from "./no-e4x-syntax.js"
import noRhinoImportGlobals from "./no-rhino-import-globals.js"
import noTypeAnnotations from "./no-type-annotations.js"
import preferConst from "./prefer-const.js"
import rhinoConstCompat from "./rhino-const-compat.js"
import rhinoConstConflict from "./rhino-const-conflict.js"
import validRequirePath from "./valid-require-path.js"

const sfcc = {
  rules: {
    "no-ds-files": noDsFiles,
    "no-e4x-syntax": noE4xSyntax,
    "no-type-annotations": noTypeAnnotations,
    "no-rhino-import-globals": noRhinoImportGlobals,
    "prefer-const": preferConst,
    "rhino-const-compat": rhinoConstCompat,
    "rhino-const-conflict": rhinoConstConflict,
    "valid-require-path": validRequirePath,
  },
}

export default sfcc
