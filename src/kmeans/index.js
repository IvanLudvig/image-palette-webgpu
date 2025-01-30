import { setupCompute } from './pipelines/compute.js';
import params from '../params.js';
import { floatArrayToHex } from '../utils/color_utils.js';

export async function extractDominantColorsKMeansGPU(device, source, initialCentroidsBuffer = null) {
    const {
        colorCount,
        centroidsBuffer,
        centroidsDeltaBuffer,
        assignPipeline,
        updatePipeline,
        computeBindGroup
    } = await setupCompute(device, source, initialCentroidsBuffer);

    const stagingCentroidsDeltaBuffer = device.createBuffer({
        label: 'centroids-delta-staging',
        size: params.K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    let encoder = device.createCommandEncoder();

    if (initialCentroidsBuffer) {
        encoder.copyBufferToBuffer(
            initialCentroidsBuffer, 0,
            centroidsBuffer, 0,
            3 * params.K * Float32Array.BYTES_PER_ELEMENT
        );
    } else {
        const centroids = new Float32Array(3 * params.K);
        for (let i = 0; i < 3 * params.K; i++) {
            centroids[i] = Math.random();
        }
        device.queue.writeBuffer(centroidsBuffer, 0, centroids);
    }

    for (let i = 0; i < params.maxIterations; i++) {
        const assignPass = encoder.beginComputePass();
        assignPass.setPipeline(assignPipeline);
        assignPass.setBindGroup(0, computeBindGroup);
        assignPass.dispatchWorkgroups(Math.ceil(colorCount / params.workgroupSize));
        assignPass.end();

        const updatePass = encoder.beginComputePass();
        updatePass.setPipeline(updatePipeline);
        updatePass.setBindGroup(0, computeBindGroup);
        updatePass.dispatchWorkgroups(params.K);
        updatePass.end();

        if (i !== 0 && i % params.convergenceCheck === 0) {
            encoder.copyBufferToBuffer(
                centroidsDeltaBuffer, 0,
                stagingCentroidsDeltaBuffer, 0,
                params.K * Float32Array.BYTES_PER_ELEMENT
            );

            const commandBuffer = encoder.finish();
            device.queue.submit([commandBuffer]);
            encoder = device.createCommandEncoder();

            await stagingCentroidsDeltaBuffer.mapAsync(GPUMapMode.READ, 0, params.K * Float32Array.BYTES_PER_ELEMENT);
            const centroidsDeltaData = new Float32Array(stagingCentroidsDeltaBuffer.getMappedRange());
            const deltaSum = centroidsDeltaData.reduce((acc, val) => acc + val, 0);
            stagingCentroidsDeltaBuffer.unmap();
            if (deltaSum < params.convergenceEps) {
                console.log(`Convergence reached at iteration ${i}`);
                break;
            }
        }
    }

    device.queue.submit([encoder.finish()]);
    return centroidsBuffer;
}

export async function extractDominantColorsKMeans(imageSource) {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        window.alert('WebGPU not supported');
        throw new Error('WebGPU not supported');
    }

    const source = await createImageBitmap(imageSource, { colorSpaceConversion: 'none' });
    const resultsBuffer = await extractDominantColorsKMeansGPU(device, source);
    
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

    const hexColors = floatArrayToHex(new Float32Array(validColors));
    return hexColors;
}
