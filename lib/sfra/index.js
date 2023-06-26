const sfccGlobals = require('../sfccGlobals')

module.exports = {
  extends: [
    'airbnb-base/legacy',
  ],
  plugins: ['sitegenesis'],
  env: {
    commonjs: true,
    es6: true,
  },
  globals: sfccGlobals,
  rules: {
    'import/no-unresolved': 'off',
    // indent: ['error', 4, { SwitchCase: 1, VariableDeclarator: 1 }],
    'func-names': 'off',
    'require-jsdoc': 'error',
    'valid-jsdoc': ['error', {
      preferType: {
        Boolean: 'boolean', Number: 'number', object: 'Object', String: 'string',
      },
      requireReturn: false,
    }],
    'vars-on-top': 'off',
    'global-require': 'off',
    'no-shadow': ['error', { allow: ['err', 'callback'] }],

    // fix configuration for newer ESLint versions
    'comma-dangle': 'off',
    'function-call-argument-newline': 'off',
    'function-paren-newline': 'off',
    indent: 'off',
    'lines-around-directive': 'off',
    'linebreak-style': 'off',
    'max-len': 'off',
    'no-else-return': 'off',
    'no-multi-assign': 'off',
    'no-multiple-empty-lines': 'off',
    'no-plusplus': 'off',
    'no-redeclare': 'off',
    'no-tabs': 'off',
    'no-underscore-dangle': 'off',
    'no-unused-vars': 'off',
    'no-useless-return': 'off',
    'object-curly-newline': 'off',
    'operator-linebreak': 'off',
    'spaced-comment': 'off',
    strict: 'off',
  },
  // overrides: [
  //   {
  //     files: [
  //       '**/controllers/**',
  //     ],
  //     rules: {
  //       'sitegenesis/no-global-require': ['error'],
  //     },
  //   },
  // ],
}
