import { extractDominantColorsCelebi } from '../../src/celebi/index.js';
import { renderColors, setupImageUploadListener } from '../demo_utils.js';

const image = document.querySelector('img');
const imageUpload = document.getElementById('image-upload');
const palette = document.getElementById('color-palette');
const kInput = document.getElementById('k-input');

async function run() {
    palette.innerHTML = '';

    const K = parseInt(kInput.value);
    if (isNaN(K) || K < 1 || K > 16) {
        alert('Invalid number of colors');
        return;
    }

    const colors = await extractDominantColorsCelebi(image, K);
    renderColors(palette, colors);
}

kInput.addEventListener('input', run);
imageUpload.addEventListener('change', run);

setupImageUploadListener(imageUpload, image);
run();
