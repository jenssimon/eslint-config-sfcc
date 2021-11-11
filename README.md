[![NPM version][npm-image]][npm-url] [![Downloads][npm-downloads-image]][npm-url] [![star this repo][gh-stars-image]][gh-url] [![fork this repo][gh-forks-image]][gh-url] [![Build Status][travis-image]][travis-url] ![Code Style][codestyle-image]

# eslint-config-sfcc

> A collection of shareable ESLint configurations for Salesforce Commerce Cloud (SFCC)

## Installation

```sh
$ yarn add @jenssimon/eslint-config-sfcc --dev
```

## General

All configurations are based on the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript#readme) and a set of additions ([@jenssimon/eslint-config-base](https://github.com/jenssimon/eslint-config-base#readme)).

This package contains a recommended configuration and a configuration that matches the original ESLint configuration for the Storefront Reference Architecture (SFRA) with adjustments to validate with newer ESLint versions.

## Configurations

### Standard configuration

This configuration is recommended for every custom cartridge. It is based on ([@jenssimon/eslint-config-base](https://github.com/jenssimon/eslint-config-base#readme)).

```json
{
  "extends": [
    "@jenssimon/sfcc"
  ]
}
```

### Configuration for SFRA

This configuration matches the original ESLint configuration for the Storefront Reference Architecture (SFRA) with adjustments to validate with newer ESLint versions.
It's only thought to be used with `app_storefront_base`.

```json
{
  "extends": [
    "@jenssimon/sfcc/sfra"
  ]
}
```

There is also a configuration for client side JS that extends the configuration mentioned above.

```json
{
  "extends": [
    "@jenssimon/sfcc/sfra-storefront"
  ]
}
```

## License

MIT © 2021 [Jens Simon](https://github.com/jenssimon)

[npm-url]: https://www.npmjs.com/package/@jenssimon/eslint-config-sfcc
[npm-image]: https://badgen.net/npm/v/@jenssimon/eslint-config-sfcc
[npm-downloads-image]: https://badgen.net/npm/dw/@jenssimon/eslint-config-sfcc

[gh-url]: https://github.com/jenssimon/eslint-config-sfcc
[gh-stars-image]: https://badgen.net/github/stars/jenssimon/eslint-config-sfcc
[gh-forks-image]: https://badgen.net/github/forks/jenssimon/eslint-config-sfcc

[travis-url]: https://travis-ci.com/jenssimon/eslint-config-sfcc
[travis-image]: https://travis-ci.com/jenssimon/eslint-config-sfcc.svg?branch=master

[codestyle-image]: https://badgen.net/badge/code%20style/airbnb/f2a
