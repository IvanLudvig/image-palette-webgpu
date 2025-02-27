/**
 * Builds a histogram from an image source.
 * @param {ImageBitmap} source - The image bitmap to build the histogram from.
 * @returns {Float32Array} The histogram array with elements in format [r, g, b, count].
 */
export function buildHistogram(source) {
    const canvas = new OffscreenCanvas(source.width, source.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0);
    const imageData = ctx.getImageData(0, 0, source.width, source.height).data;
    const colorHistogram = new Map();
    for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const key = (r << 16) | (g << 8) | b;
        colorHistogram.set(key, (colorHistogram.get(key) ?? 0) + 1);
    }

    const colorCount = colorHistogram.size;
    const histogramArray = new Float32Array(colorCount * 4);
    let i = 0;
    for (const [key, count] of colorHistogram) {
        const r = (key >> 16) & 0xFF;
        const g = (key >> 8) & 0xFF;
        const b = key & 0xFF;

        histogramArray[i * 4] = r / 255;
        histogramArray[i * 4 + 1] = g / 255;
        histogramArray[i * 4 + 2] = b / 255;
        histogramArray[i * 4 + 3] = count;
        i++;
    }

    return histogramArray;
}