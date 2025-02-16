import { extractDominantColorsWuGPU } from '../wu/index.js';
import { extractDominantColorsKMeansGPU } from '../kmeans/index.js';
import { floatArrayToHex } from '../utils/color_utils.js';

export async function extractDominantColorsCelebiGPU(device, source, K) {
    const wuResultsBuffer = await extractDominantColorsWuGPU(device, source, K);
    const resultsBuffer = await extractDominantColorsKMeansGPU(device, source, K, wuResultsBuffer);
    return resultsBuffer;
}

/**
 * Extracts dominant colors from an image source using WebGPU API with Celebi algorithm.
 * @param {ImageBitmapSource} imageSource - The image source to process.
 * @param {number} K - The number of dominant colors to extract.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of dominant colors.
 */
export async function extractDominantColorsCelebi(imageSource, K) {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        window.alert('WebGPU not supported');
        throw new Error('WebGPU not supported');
    }

    const source = await createImageBitmap(imageSource, { colorSpaceConversion: 'none' });
    const resultsBuffer = await extractDominantColorsCelebiGPU(device, source, K);

    const stagingResultsBuffer = device.createBuffer({
        size: 3 * K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(
        resultsBuffer, 0,
        stagingResultsBuffer, 0,
        3 * K * Float32Array.BYTES_PER_ELEMENT
    );
    device.queue.submit([encoder.finish()]);

    await stagingResultsBuffer.mapAsync(GPUMapMode.READ, 0, 3 * K * Float32Array.BYTES_PER_ELEMENT);
    const mappedData = stagingResultsBuffer.getMappedRange();
    const colors = new Float32Array(mappedData.slice(0));
    stagingResultsBuffer.unmap();

    const validColors = [];
    for (let i = 0; i < colors.length; i += 3) {
        const isValid = [colors[i], colors[i + 1], colors[i + 2]].every(x => !isNaN(x) && x >= 0);
        if (isValid) {
            validColors.push(colors[i], colors[i + 1], colors[i + 2]);
        }
    }

    const hexColors = floatArrayToHex(new Float32Array(validColors));
    return hexColors;
}
