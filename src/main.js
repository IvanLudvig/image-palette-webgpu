import { setupCompute } from './pipelines/compute.js';
import params from './params.js';
import { floatArrayToHex } from './utils.js';

export async function extractDominantColors(device, imageSource) {
    const source = await createImageBitmap(imageSource, { colorSpaceConversion: 'none' });

    const {
        colorCount,
        centroidsBuffer: computeCentroidsBuffer,
        assignPipeline,
        updatePipeline,
        computeBindGroup
    } = await setupCompute(device, source);

    const centroidsBuffer = device.createBuffer({
        label: 'centroids-render',
        size: 3 * params.K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    const encoder = device.createCommandEncoder();

    for (let i = 0; i < params.iterations; i++) {
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
    }

    encoder.copyBufferToBuffer(
        computeCentroidsBuffer, 0,
        centroidsBuffer, 0,
        3 * params.K * Float32Array.BYTES_PER_ELEMENT
    );

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    await centroidsBuffer.mapAsync(GPUMapMode.READ, 0, params.K * 3 * Float32Array.BYTES_PER_ELEMENT);
    const mappedData = centroidsBuffer.getMappedRange();
    const colors = new Float32Array(mappedData.slice(0));
    centroidsBuffer.unmap();

    const hexColors = floatArrayToHex(colors);
    return hexColors;
}
