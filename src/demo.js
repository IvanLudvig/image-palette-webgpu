import { extractDominantColors } from './main.js';
import params from './params.js';

const image = document.querySelector('img');
const imageUpload = document.getElementById('image-upload');

async function run() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        window.alert('WebGPU not supported');
        throw new Error('WebGPU not supported');
    }

    const colors = await extractDominantColors(device, image);

    const canvas = document.querySelector('canvas');
    const squareSize = 32;
    canvas.width = squareSize * params.K;
    canvas.height = squareSize;
    const context = canvas.getContext('2d');

    colors.forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect(index * squareSize, 0, squareSize, squareSize);
    });

}

imageUpload.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.type.startsWith('image/')) {
            const imageUrl = URL.createObjectURL(file);
            image.src = imageUrl;
            await new Promise(resolve => image.onload = resolve);
            await run();
            URL.revokeObjectURL(imageUrl);
        } else {
            alert('Not an image file');
        }
    }
});

run();
