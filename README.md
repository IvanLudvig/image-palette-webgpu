[![Published on NPM](https://img.shields.io/npm/v/image-palette-webgpu.svg)](https://npmjs.com/package/image-palette-webgpu)

A tiny zero-dependency browser package that extracts dominant color or color palette from an image using WebGPU API with various algorithms.

# Table of contents

- [Live demo](#live-demo)
- [Install](#install)
- [Import](#import)
  * [Local](#local)
    + [JS](#js)
    + [HTML](#html)
    + [Import maps](#import-maps)
      - [JS](#js-1)
      - [HTML](#html-1)
    + [Dev Servers / Builders](#dev-servers--builders)
      - [JS](#js-2)
      - [HTML](#html-2)
  * [CDN](#cdn)
    + [UNPKG](#unpkg)
      - [JS](#js-3)
      - [HTML](#html-3)
    + [ESM CDN](#esm-cdn)
      - [JS](#js-4)
      - [HTML](#html-4)
    + [Skypack](#skypack)
      - [JS](#js-5)
      - [HTML](#html-5)
- [Use](#use)
  * [JS](#js-6)

# Live demo

https://ivanludvig.dev/image-palette-webgpu/

# Install

```sh
npm i image-palette-webgpu
```

# Import

## Local

### JS

```js
import { extractDominantColors } from './node_modules/image-palette-webgpu/index.js';
```

### HTML

```html
<script type="module">
  import { extractDominantColors } from './node_modules/image-palette-webgpu/index.js';
</script>
```

### Import maps

```html
<script type="importmap">
  {
    "imports": {
      "image-palette-webgpu": "./node_modules/image-palette-webgpu/index.js"
    }
  }
</script>
```

#### JS

```js
import { extractDominantColors } from 'image-palette-webgpu';
```

#### HTML

```html
<script type="module">
  import { extractDominantColors } from 'image-palette-webgpu';
</script>
```

### Dev Servers / Builders

#### JS

```js
import { extractDominantColors } from 'image-palette-webgpu';
```

#### HTML

```html
<script type="module">
  import { extractDominantColors } from 'image-palette-webgpu';
</script>
```

## CDN

### UNPKG

#### JS

```js
import { extractDominantColors } from 'https://unpkg.com/image-palette-webgpu';
```

#### HTML

```html
<script type="module">
  import { extractDominantColors } from 'https://unpkg.com/image-palette-webgpu';
</script>
```

### ESM CDN

#### JS

```js
import { extractDominantColors } from 'https://esm.sh/image-palette-webgpu';
```

#### HTML

```html
<script type="module">
  import { extractDominantColors } from 'https://esm.sh/image-palette-webgpu';
</script>
```

### Skypack

#### JS

```js
import { extractDominantColors } from 'https://cdn.skypack.dev/image-palette-webgpu';
```

#### HTML

```html
<script type="module">
  import { extractDominantColors } from 'https://cdn.skypack.dev/image-palette-webgpu';
</script>
```

# Use

## JS

```js
const image = new Image();
image.src = './image.png';
const colorCount = 5;
const algorithm = 'wu';
await image.decode();
const dominantColors = await extractDominantColors(image, colorCount, algorithm);
console.log(dominantColors); // ['#d65a58', '#c84c52', '#d65a59', '#bb464b', '#e3dbaa']
```
