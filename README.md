[![Published on NPM](https://img.shields.io/npm/v/image-palette-webgpu.svg)](https://npmjs.com/package/image-palette-webgpu)

A tiny zero-dependency browser package that extracts dominant color or color palette from an image using WebGPU API with various algorithms.

# Live demo

https://ivanludvig.github.io/color-quantization-webgpu/

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

### Dev Servers / Builders

#### JS
#### HTML

### CDN

#### UNPKG
##### JS
##### HTML

#### ESM CDN
##### JS
##### HTML

#### Skypack
##### JS
##### HTML

# Use

## JS

```js
const image = new Image();
image.src = './image.png';
const colorsCount = 5;
const algorithm = 'wu';
const dominantColors = await extractDominantColors(image, colorsCount, algorithm);
console.log(dominantColors); // ['#d65a58', '#c84c52', '#d65a59', '#bb464b', '#e3dbaa']
```

## HTML
