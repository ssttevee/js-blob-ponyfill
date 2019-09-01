# Description

Implementation of the Web APIs' `Blob` interface using modern javascript.

`File`, `FileReader`, and `FileReaderSync` are also included because they are part of the same api spec.

This package may use potentially missing interfaces, like `EventTarget`, without any reservation. Please use a different package to fill in the gaps.

# Installation

```bash
npm install @ssttevee/blob-ponyfill
```

# Importing

```js
import Blob, { /* Blob, */ File, FileReader, FileReaderSync } from '@ssttevee/blob-ponyfill';
```

or if bundle size is a concern

```js
import Blob from '@ssttevee/blob-ponyfill/blob';
import File from '@ssttevee/blob-ponyfill/file';
import FileReader from '@ssttevee/blob-ponyfill/filereader';
import FileReaderSync from '@ssttevee/blob-ponyfill/filereadersync';
```

# Usage

It's probably best if this package is used with a bundler like webpack or rollup and injected with the [`webpack.ProvidePlugin`](https://webpack.js.org/guides/shimming/) or [`rollup-inject-plugin`](https://github.com/rollup/rollup-plugin-inject) respectively.

## Webpack

```js
// webpack.config.js
const webpack = require('webpack');

module.exports = {
    // other config
    plugins: [
        new webpack.ProvidePlugin({
            Blob: '@ssttevee/blob-ponyfill',
            File: ['@ssttevee/blob-ponyfill', 'File'],
        })
    ]
    // more config
};
```

## Rollup

```js
// rollup.config.js
import inject from 'rollup-plugin-inject';

export default {
    // other config
    plugins: [
        inject({
            Blob: '@ssttevee/blob-ponyfill',
            File: ['@ssttevee/blob-ponyfill', 'File'],
        }),
    ],
    // more config
};
```
