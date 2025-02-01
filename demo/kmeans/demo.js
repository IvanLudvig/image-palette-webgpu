import { extractDominantColorsKMeans } from '../../src/kmeans/index.js';
import { renderColors, setupImageUploadListener, setupRunButtonListener } from '../demo_utils.js';

const image = document.querySelector('img');
const imageUpload = document.getElementById('image-upload');
const palette = document.getElementById('color-palette');
const kInput = document.getElementById('k-input');
const runButton = document.getElementById('run-button');

async function run() {
    palette.innerHTML = '';

    const K = parseInt(kInput.value);
    if (isNaN(K) || K < 1 || K > 16) {
        alert('Invalid number of colors');
        return;
    }

    const colors = await extractDominantColorsKMeans(image, K);
    renderColors(palette, colors);
}

setupImageUploadListener(imageUpload, image);
setupRunButtonListener(runButton, run);
run();
