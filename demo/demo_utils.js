export function renderColors(palette, colors) {
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

export function setupImageUploadListener(imageUpload, image) {
    imageUpload.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                const imageUrl = URL.createObjectURL(file);
                image.src = imageUrl;
                await new Promise(resolve => image.onload = resolve);
                URL.revokeObjectURL(imageUrl);
            } else {
                alert('Not an image file');
            }
        }
    });
}
