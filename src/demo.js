import { extractDominantColors } from './main.js';

const image = document.querySelector('img');
const imageUpload = document.getElementById('image-upload');
const palette = document.getElementById('color-palette');

async function run() {
    const colors = await extractDominantColors(image);

    palette.innerHTML = '';
    colors.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        
        const colorSquare = document.createElement('div');
        colorSquare.className = 'color-square';
        colorSquare.style.backgroundColor = color;
        
        const colorLabel = document.createElement('div');
        colorLabel.className = 'color-label';
        colorLabel.textContent = color.toUpperCase();
        
        colorBox.appendChild(colorSquare);
        colorBox.appendChild(colorLabel);
        palette.appendChild(colorBox);
    });
}

imageUpload.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.type.startsWith('image/')) {
            const imageUrl = URL.createObjectURL(file);
            image.src = imageUrl;
            palette.innerHTML = '';
            await new Promise(resolve => image.onload = resolve);
            await run();
            URL.revokeObjectURL(imageUrl);
        } else {
            alert('Not an image file');
        }
    }
});

run();
