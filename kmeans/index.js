import { setupAssign } from './pipelines/assign.js';
import { setupUpdate } from './pipelines/update.js';
import { floatArrayToHex } from '../utils/color_utils.js';
import { buildHistogram } from '../utils/build_histogram.js';

export async function extractDominantColorsKMeansGPU(device, source, K, initialCentroidsBuffer = null) {
    const MAX_ITERATIONS = 256;
    const CONVERGENCE_EPS = 0.01;
    const CONVERGENCE_CHECK = 8;

    const histogramArray = buildHistogram(source);
    const colorCount = histogramArray.length / 4;

    const {
        centroidsBuffer,
        clustersBuffer,
        assignPipeline,
        computeBindGroup,
        computeBindGroupLayout,
        assignBindGroup
    } = await setupAssign(device, K, histogramArray, colorCount);

    const {
        updatePipeline,
        updateBindGroup,
        centroidsDeltaBuffer
    } = await setupUpdate(device, K, computeBindGroupLayout, centroidsBuffer, clustersBuffer);

    const stagingCentroidsDeltaBuffer = device.createBuffer({
        label: 'centroids-delta-staging',
        size: K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    let encoder = device.createCommandEncoder();

    if (initialCentroidsBuffer) {
        encoder.copyBufferToBuffer(
            initialCentroidsBuffer, 0,
            centroidsBuffer, 0,
            3 * K * Float32Array.BYTES_PER_ELEMENT
        );
    } else {
        const centroids = new Float32Array(3 * K);
        for (let i = 0; i < 3 * K; i++) {
            centroids[i] = Math.random();
        }
        device.queue.writeBuffer(centroidsBuffer, 0, centroids);
    }

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const assignPass = encoder.beginComputePass();
        assignPass.setPipeline(assignPipeline);
        assignPass.setBindGroup(0, computeBindGroup);
        assignPass.setBindGroup(1, assignBindGroup);
        assignPass.dispatchWorkgroups(Math.ceil(colorCount / 256));
        assignPass.end();

        const updatePass = encoder.beginComputePass();
        updatePass.setPipeline(updatePipeline);
        updatePass.setBindGroup(0, computeBindGroup);
        updatePass.setBindGroup(1, updateBindGroup);
        updatePass.dispatchWorkgroups(Math.ceil(K / 16));
        updatePass.end();

        if (i !== 0 && i % CONVERGENCE_CHECK === 0) {
            encoder.copyBufferToBuffer(
                centroidsDeltaBuffer, 0,
                stagingCentroidsDeltaBuffer, 0,
                K * Float32Array.BYTES_PER_ELEMENT
            );

            const commandBuffer = encoder.finish();
            device.queue.submit([commandBuffer]);
            encoder = device.createCommandEncoder();

            await stagingCentroidsDeltaBuffer.mapAsync(GPUMapMode.READ, 0, K * Float32Array.BYTES_PER_ELEMENT);
            const centroidsDeltaData = new Float32Array(stagingCentroidsDeltaBuffer.getMappedRange());
            const deltaSum = centroidsDeltaData.reduce((acc, val) => acc + val, 0);
            stagingCentroidsDeltaBuffer.unmap();
            if (deltaSum < CONVERGENCE_EPS) {
                console.log(`Convergence reached at iteration ${i}`);
                break;
            }
        }
    }

    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();

    return centroidsBuffer;
}

/**
 * Extracts dominant colors from an image source using WebGPU API with K-Means algorithm.
 * @param {ImageBitmapSource} imageSource - The image source to process.
 * @param {number} K - The number of dominant colors to extract.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of dominant colors.
 */
export async function extractDominantColorsKMeans(imageSource, K) {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        window.alert('WebGPU not supported');
        throw new Error('WebGPU not supported');
    }

    const source = await createImageBitmap(imageSource, { colorSpaceConversion: 'none' });
    const resultsBuffer = await extractDominantColorsKMeansGPU(device, source, K);

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
