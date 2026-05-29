# @jenssimon/eslint-config-sfcc

Shareable ESLint flat config for Salesforce Commerce Cloud (SFCC) projects.

## Key Features Checked (Allow/Block)

**Allowed:**

- ES5 syntax and common patterns that are guaranteed to work on SFCC/Rhino
- Selected ES2015+ features that are proven to work on SFCC (e.g. `String.raw`, some Array methods)

**Blocked:**

- Modern language features not supported on SFCC/Rhino (e.g. optional chaining, nullish coalescing, async/await, object spread, many ES2015+ builtins)
- Top-level `await`, dynamic `import()`, class fields, new builtins like `Map`, `Set`, `Promise`, `Symbol`, etc.
- JSX/E4X-like tag syntax (e.g. `<a/>`) that may be misparsed in JavaScript linting workflows
- Features that would cause runtime or syntax errors on SFCC
- Many ES2015+ Array/String/Object methods missing in Rhino
- ECMAScript modules (`import`/`export`), as SFCC only supports CommonJS
- Common pitfalls like duplicate `const` declarations in blocks (Rhino scoping)

See the integration tests for concrete examples.

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
    sfcc: {
      checkCartridgeExists: true,
      allowBareModules: ["server", "proxyquire"],
      cartridgePath: ["app_storefront", "modules", "app_custom"],
    },
  }),
)
```

---

## Built-in Plugins

This package ships two built-in ESLint plugins, both automatically registered in the recommended config:

1. `sfcc` for general SFCC/Rhino compatibility rules
2. `sitegenesis` for the SiteGenesis-specific controller rule ported from [`eslint-plugin-sitegenesis`](https://www.npmjs.com/package/eslint-plugin-sitegenesis)

### `sitegenesis`

`sitegenesis` now only contains `sitegenesis/no-global-require`.

That rule stays enabled in the recommended config by default, because it is still useful protection for repositories that contain SiteGenesis-style controller code. In non-SiteGenesis projects it is effectively dormant, because it only applies to files under `cartridge/controllers/`.

| Rule                            | Description                                                                                                                                              | Default |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `sitegenesis/no-global-require` | Disallows top-level `require()` calls in controller files when not every route function uses them. Only applies to files under `cartridge/controllers/`. | `error` |

### `sfcc`

The new `sfcc` plugin contains the general Rhino/SFCC runtime rules:

| Rule                        | Description                                                                                                                                             | Default |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `sfcc/no-e4x-syntax`        | Disallows JSX/E4X-like tag syntax (e.g. `<a/>`) in SFCC JavaScript to avoid parser ambiguity and unsupported runtime patterns.                          | `error` |
| `sfcc/prefer-const`         | Requires `const` for `let` declarations that are never reassigned, excluding Rhino-sensitive nested/loop contexts.                                      | `error` |
| `sfcc/rhino-const-compat`   | Enforces `let` instead of `const` in Rhino loop-critical contexts (loop headers and declarations inside loop bodies) and supports auto-fix.             | `error` |
| `sfcc/rhino-const-conflict` | Detects same-name `const` declarations in nested blocks within the same function (Rhino treats them as function-scoped) and supports auto-fix to `let`. | `error` |
| `sfcc/valid-require-path`   | Validates SFCC-compatible `require()` paths (`dw/*`, `cartridgeName/*`, `./*`, `../*`, `*/*`, `~/*`) and supports optional filesystem existence checks. | `error` |

The recommended config intentionally combines these `sfcc/*` rules so `--fix` does not bounce between conflicting suggestions: Rhino-unsafe `const` becomes `let`, while genuinely safe top-level function bindings still become `const`.

### Shared `sfcc` options

By default, `sfcc/valid-require-path` validates path patterns only and allows bare `server` requires.

Use `createRecommendedConfig({ sfcc: ... })` to define shared SFCC plugin options centrally. These values are exposed through ESLint `settings.sfcc`, so future `sfcc/*` rules can reuse them without adding per-rule options.

```js
import { defineConfig } from "eslint/config"
import { createRecommendedConfig } from "@jenssimon/eslint-config-sfcc"

export default defineConfig(
  createRecommendedConfig({
    cartridgesDir: "cartridges",
    sfcc: {
      // Optional: allow additional bare module ids
      allowBareModules: ["server", "proxyquire"],
      // Optional: verify cartridgeName/* plus */* and ~/* against filesystem
      checkCartridgeExists: true,
      // Optional: explicit cartridge order for */* lookup (otherwise folders in cartridgesDir are used)
      cartridgePath: ["app_storefront", "modules", "app_custom"],
      // Optional: path to site template directory
      siteTemplatePath: "sites/site_template",
      // Optional: site id under <siteTemplatePath>/sites/<site>/site.xml
      site: "example",
    },
  }),
)
```

### Rhino const strategy example

Example:

```js
function route() {
  let topLevel = 1 // sfcc/prefer-const -> const

  for (let i = 0; i < 3; i += 1) {
    const loopValue = i * 2 // sfcc/rhino-const-compat -> let
    process(loopValue)
  }

  if (flagA) {
    const temp = 1 // with another nested const temp below: sfcc/rhino-const-conflict -> let
    process(temp)
  }
  if (flagB) {
    const temp = 2 // sfcc/rhino-const-conflict -> let
    process(temp)
  }

  return topLevel
}
```

### Direct plugin usage

```js
import { defineConfig } from "eslint/config"
import eslintConfigSfcc, { sfcc as sfccPlugin, sitegenesis } from "@jenssimon/eslint-config-sfcc"

export default defineConfig(eslintConfigSfcc.configs.recommended, {
  plugins: {
    sfcc: sfccPlugin,
    sitegenesis,
  },
  rules: {
    "sfcc/prefer-const": "error",
    "sitegenesis/no-global-require": "error",
  },
})
```

### Decision matrix: `const` vs `let`

- Function top-level (`function route() { ... }`) and never reassigned: use `const` (`sfcc/prefer-const`)
- Loop header (`for (const x of xs)`, `for (const k in obj)`, `for (const i = 0; ...)`): use `let` (`sfcc/rhino-const-compat`)
- Declaration inside a loop body: use `let` (`sfcc/rhino-const-compat`)
- Nested block with unique name in same function: `const` is allowed
- Nested block with same `const` name reused in sibling/other nested blocks of same function: use `let` (`sfcc/rhino-const-conflict`)

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

A: Not safe for Rhino. Both declarations are treated as function-scoped const bindings with the same name. `sfcc/rhino-const-conflict` reports this and auto-fixes to `let`.

Q: Are `XML` and `XMLList` identifiers allowed?

A: Yes. Constructor-style usage such as `const xmlCtor = XML` and `const xmlListCtor = XMLList` is allowed. `sfcc/no-e4x-syntax` only targets JSX/E4X-like tag syntax (for example `<a/>`).

Q: Does `sfcc/no-e4x-syntax` report `default xml namespace = "..."`?

A: No. That construct fails during parsing before rules run, so ESLint reports a fatal parsing error first. The rule cannot execute on code that does not parse.

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
The `sfra` and `sfra-storefront` configurations have been removed. These configurations were specific to SFRA and SiteGenesis and are not part of this general-purpose SFCC config. The external `eslint-plugin-sitegenesis` dependency is no longer used — `sitegenesis/no-global-require` is now built in, and the Rhino-specific general rules live in the built-in `sfcc` plugin.

### Migration steps

1. Replace `.eslintrc.*` with `eslint.config.js`
2. Update the package name and import (see [Usage](#recommended-config) above)
3. Remove [`@jenssimon/eslint-config-base`](https://github.com/jenssimon/eslint-config-base), [`eslint-plugin-es5`](https://github.com/nkt/eslint-plugin-es5), and [`eslint-plugin-sitegenesis`](https://www.npmjs.com/package/eslint-plugin-sitegenesis) from your dependencies — `sitegenesis/no-global-require` is built in and the general Rhino rules are now `sfcc/*`
4. Add any formatting rules you need directly to your own `eslint.config.js`

## Development

```bash
vp install
vp test
vp check
vp pack
```
