import { extractDominantColorsWuGPU } from '../wu/index.js';
import { extractDominantColorsKMeansGPU } from '../kmeans/index.js';
import params from '../params.js';
import { floatArrayToHex } from '../utils/color_utils.js';

export async function extractDominantColorsCelebiGPU(device, source) {
    const wuResultsBuffer = await extractDominantColorsWuGPU(device, source);
    const resultsBuffer = await extractDominantColorsKMeansGPU(device, source, wuResultsBuffer);
    return resultsBuffer;
}

export async function extractDominantColorsCelebi(imageSource) {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        throw new Error('WebGPU not supported');
    }

    const source = await createImageBitmap(imageSource, { colorSpaceConversion: 'none' });
    const resultsBuffer = await extractDominantColorsCelebiGPU(device, source);
    
    const stagingResultsBuffer = device.createBuffer({
        size: 3 * params.K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(
        resultsBuffer, 0,
        stagingResultsBuffer, 0,
        3 * params.K * Float32Array.BYTES_PER_ELEMENT
    );
    device.queue.submit([encoder.finish()]);

    await stagingResultsBuffer.mapAsync(GPUMapMode.READ, 0, 3 * params.K * Float32Array.BYTES_PER_ELEMENT);
    const mappedData = stagingResultsBuffer.getMappedRange();
    const colors = new Float32Array(mappedData.slice(0));
    stagingResultsBuffer.unmap();

    const validColors = [];
    for (let i = 0; i < colors.length; i += 3) {
        if (!isNaN(colors[i]) && !isNaN(colors[i + 1]) && !isNaN(colors[i + 2])) {
            validColors.push(colors[i], colors[i + 1], colors[i + 2]);
        }
    }

    return floatArrayToHex(new Float32Array(validColors));
}
