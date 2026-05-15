# @jenssimon/eslint-config-sfcc

Shareable ESLint flat config for Salesforce Commerce Cloud (SFCC) projects.

This config focuses exclusively on **JavaScript compatibility** for the SFCC/Rhino engine. It detects the use of JavaScript features that are not supported on SFCC sandboxes — it does not enforce any code style or formatting rules. When used alongside a recommended config from [`eslint`](https://github.com/eslint/eslint), [`eslint-plugin-unicorn`](https://github.com/sindresorhus/eslint-plugin-unicorn), or [`eslint-plugin-sonarjs`](https://github.com/SonarSource/eslint-plugin-sonarjs), it disables rules that require ES2015+ features unsupported in the Rhino environment.

## Recommended Config

### Install

```bash
pnpm add -D eslint @jenssimon/eslint-config-sfcc
```

### Use in `eslint.config.js`

```js
import { defineConfig } from "eslint/config"
import sfcc from "@jenssimon/eslint-config-sfcc"

export default defineConfig(
  // ...
  sfcc.configs.recommended,
)
```

By default, JavaScript files under `cartridges/` are linted. Client-side and static asset folders are excluded.

### Customize with helper

```js
import { defineConfig } from "eslint/config"
import { createRecommendedConfig } from "@jenssimon/eslint-config-sfcc"

export default defineConfig(
  createRecommendedConfig({
    cartridgesDir: "cartridges/",
  }),
)
```

---

## Built-in Plugin: `sitegenesis`

This package ships a built-in ESLint plugin with rules ported from [`eslint-plugin-sitegenesis`](https://www.npmjs.com/package/eslint-plugin-sitegenesis) and adapted for ESLint 9+. The plugin is automatically registered in the recommended config.

The plugin is also exported for direct use in custom configs:

```js
import { defineConfig } from "eslint/config"
import sfcc, { sitegenesis } from "@jenssimon/eslint-config-sfcc"

export default defineConfig(sfcc.configs.recommended, {
  plugins: { sitegenesis },
  rules: {
    "sitegenesis/no-global-require": "error",
  },
})
```

### Rules

| Rule                               | Description                                                                                                                                              | Default |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `sitegenesis/no-global-require`    | Disallows top-level `require()` calls in controller files when not every route function uses them. Only applies to files under `cartridge/controllers/`. | `error` |
| `sitegenesis/prefer-const`         | Requires `const` for `let` declarations that are never reassigned, excluding Rhino-sensitive nested/loop contexts.                                       | `error` |
| `sitegenesis/rhino-const-compat`   | Enforces `let` instead of `const` in Rhino loop-critical contexts (loop headers and declarations inside loop bodies) and supports auto-fix.              | `error` |
| `sitegenesis/rhino-const-conflict` | Detects same-name `const` declarations in nested blocks within the same function (Rhino treats them as function-scoped) and supports auto-fix to `let`.  | `error` |

### Rhino const strategy

The recommended config intentionally combines three rules:

1. `sitegenesis/prefer-const` to keep top-level function declarations idiomatic (`let` -> `const` when safe).
2. `sitegenesis/rhino-const-compat` to force `let` in loop-related Rhino edge cases.
3. `sitegenesis/rhino-const-conflict` to prevent sibling nested-block `const` name collisions in the same function.

This avoids rule ping-pong during `--fix`: Rhino-unsafe `const` gets converted to `let`, while genuinely safe top-level function bindings still become `const`.

Example:

```js
function route() {
  let topLevel = 1 // prefer-const -> const

  for (let i = 0; i < 3; i += 1) {
    const loopValue = i * 2 // rhino-const-compat -> let
    process(loopValue)
  }

  if (flagA) {
    const temp = 1 // with another nested const temp below: rhino-const-conflict -> let
    process(temp)
  }
  if (flagB) {
    const temp = 2 // rhino-const-conflict -> let
    process(temp)
  }

  return topLevel
}
```

### Decision matrix: `const` vs `let`

- Function top-level (`function route() { ... }`) and never reassigned: use `const` (`sitegenesis/prefer-const`)
- Loop header (`for (const x of xs)`, `for (const k in obj)`, `for (const i = 0; ...)`): use `let` (`sitegenesis/rhino-const-compat`)
- Declaration inside a loop body: use `let` (`sitegenesis/rhino-const-compat`)
- Nested block with unique name in same function: `const` is allowed
- Nested block with same `const` name reused in sibling/other nested blocks of same function: use `let` (`sitegenesis/rhino-const-conflict`)

### Mini-FAQ

Q: Is this safe?

```js
if (foo === "bar") {
  const value = 1
}
```

A: Yes. A single nested-block `const` with a unique name in that function is allowed.

Q: What about this?

```js
if (foo === "bar") {
  const test = 1
}

if (foo === "baz") {
  const test = 2
}
```

A: Not safe for Rhino. Both declarations are treated as function-scoped const bindings with the same name. `sitegenesis/rhino-const-conflict` reports this and auto-fixes to `let`.

---

## Migrating from v4

This is a major release with breaking changes.

### What changed

**ESLint Flat Config**
The package now uses the [flat config format](https://eslint.org/docs/latest/use/configure/configuration-files) (`eslint.config.js`). The legacy `.eslintrc`-based format is no longer supported.

**Focus: compatibility, not formatting**
The config no longer enforces any code style or formatting rules. Its sole purpose is to detect JavaScript features that are not supported on SFCC sandboxes (Rhino engine). Formatting should be handled separately, e.g. with [Prettier](https://github.com/prettier/prettier) or [Oxfmt](https://github.com/oxc-project/oxc).

**No more base config**
The previous version extended [`@jenssimon/eslint-config-base`](https://github.com/jenssimon/eslint-config-base) (Airbnb style guide). This dependency has been removed entirely. Rules like `comma-dangle`, `no-var`, `import/*`, `consistent-return`, etc. are no longer part of this config.

**[`eslint-plugin-es5`](https://github.com/nkt/eslint-plugin-es5) → [`eslint-plugin-es`](https://github.com/mysticatea/eslint-plugin-es)**
The old `eslint-plugin-es5` has been replaced by [`eslint-plugin-es`](https://github.com/mysticatea/eslint-plugin-es). Rules have been mapped accordingly.

**No more SiteGenesis / SFRA configs**
The `sfra` and `sfra-storefront` configurations have been removed. These configurations were specific to SFRA and SiteGenesis and are not part of this general-purpose SFCC config. The external `eslint-plugin-sitegenesis` dependency is no longer used — the `sitegenesis/no-global-require` rule is now built into this package and enabled automatically.

### Migration steps

1. Replace `.eslintrc.*` with `eslint.config.js`
2. Update the package name and import (see [Usage](#recommended-config) above)
3. Remove [`@jenssimon/eslint-config-base`](https://github.com/jenssimon/eslint-config-base), [`eslint-plugin-es5`](https://github.com/nkt/eslint-plugin-es5), and [`eslint-plugin-sitegenesis`](https://www.npmjs.com/package/eslint-plugin-sitegenesis) from your dependencies — the `sitegenesis/no-global-require` rule is now built in
4. Add any formatting rules you need directly to your own `eslint.config.js`

## Development

```bash
vp install
vp test
vp check
vp pack
```

## Integration test strategy (maintainer note)

The integration suite in `tests/integration.test.ts` follows a strict order and scope so future changes stay readable and practical for SFCC teams:

1. Allowed features come before disallowed features.
2. Within sections, list common real-world use cases first.
3. Keep ES5 baseline checks minimal (sentinel tests only), because the main goal is preventing unsupported modern syntax in Rhino.
4. Keep folder-path behavior checks separate from feature compatibility checks.
5. Prefer stable behavior-oriented test names and keep rule IDs in assertions, not in test titles.

When adding or changing feature support, update both `src/rules/es.ts` and `tests/integration.test.ts` together.
