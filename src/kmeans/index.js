import { setupCompute } from './pipelines/compute.js';
import params from '../params.js';
import { floatArrayToHex } from '../utils.js';

export async function extractDominantColors(imageSource) {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        window.alert('WebGPU not supported');
        throw new Error('WebGPU not supported');
    }

    const source = await createImageBitmap(imageSource, { colorSpaceConversion: 'none' });

    const {
        colorCount,
        centroidsBuffer,
        centroidsDeltaBuffer,
        assignPipeline,
        updatePipeline,
        computeBindGroup
    } = await setupCompute(device, source);

    const stagingCentroidsBuffer = device.createBuffer({
        label: 'centroids-staging',
        size: 3 * params.K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    const stagingCentroidsDeltaBuffer = device.createBuffer({
        label: 'centroids-delta-staging',
        size: params.K * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    let encoder = device.createCommandEncoder();

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

        if (i !== 0 && i % params.convergenceCheck == 0) {
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

    encoder.copyBufferToBuffer(
        centroidsBuffer, 0,
        stagingCentroidsBuffer, 0,
        3 * params.K * Float32Array.BYTES_PER_ELEMENT
    );

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    await stagingCentroidsBuffer.mapAsync(GPUMapMode.READ, 0, params.K * 3 * Float32Array.BYTES_PER_ELEMENT);
    const mappedData = stagingCentroidsBuffer.getMappedRange();
    const colors = new Float32Array(mappedData.slice(0));
    stagingCentroidsBuffer.unmap();

    const validColors = [];
    for (let i = 0; i < colors.length; i += 3) {
        if (!isNaN(colors[i]) && !isNaN(colors[i + 1]) && !isNaN(colors[i + 2])) {
            validColors.push(colors[i], colors[i + 1], colors[i + 2]);
        }
    }

    const hexColors = floatArrayToHex(new Float32Array(validColors));
    return hexColors;
}
