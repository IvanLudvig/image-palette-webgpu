import { extractDominantColors } from '../../src/wu/index.js';
import { renderColors, setupImageUploadListener } from '../demo_utils.js';

const image = document.querySelector('img');
const imageUpload = document.getElementById('image-upload');
const palette = document.getElementById('color-palette');

async function run() {
    palette.innerHTML = '';
    const colors = await extractDominantColors(image);
    renderColors(palette, colors);
}

setupImageUploadListener(imageUpload, image, run);
run();
