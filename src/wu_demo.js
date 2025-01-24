import params from './params.js';
import { setupBuildHistogram } from './pipelines/buildHistogram.js';
import { setupComputeMoments } from './pipelines/computeMoments.js';


export async function run(imageSource) {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        window.alert('WebGPU not supported');
        throw new Error('WebGPU not supported');
    }

    const source = await createImageBitmap(imageSource, { colorSpaceConversion: 'none' });
    const width = source.width;
    const height = source.height;

    const {
        buildHistogramPipeline,
        inputBindGroup,
        buildHistogramBindGroup,
        buildHistogramBindGroupLayout
    } = await setupBuildHistogram(device, source);

    const {
        axisUniformBuffer,
        computeMomentsAxisBindGroup,
        computeMomentsPipeline
    } = await setupComputeMoments(device, buildHistogramBindGroupLayout);

    let encoder = device.createCommandEncoder();
    const buildHistogramPass = encoder.beginComputePass();
    buildHistogramPass.setPipeline(buildHistogramPipeline);
    buildHistogramPass.setBindGroup(0, inputBindGroup);
    buildHistogramPass.setBindGroup(1, buildHistogramBindGroup);
    buildHistogramPass.dispatchWorkgroups(Math.ceil(width / params.workgroupSize), Math.ceil(height / params.workgroupSize));
    buildHistogramPass.end();
    device.queue.submit([encoder.finish()]);

    const workGroupsPerDim = Math.ceil(32 / params.workgroupSize);

    for (let axis = 0; axis < 3; axis++) {
        encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setPipeline(computeMomentsPipeline);
        device.queue.writeBuffer(axisUniformBuffer, 0, new Uint32Array([axis]));
        pass.setBindGroup(0, buildHistogramBindGroup);
        pass.setBindGroup(1, computeMomentsAxisBindGroup);
        pass.dispatchWorkgroups(workGroupsPerDim, workGroupsPerDim);
        pass.end();
        device.queue.submit([encoder.finish()]);
    }

    encoder = device.createCommandEncoder();

    device.queue.submit([encoder.finish()]);
}

const image = document.querySelector('img');
run(image);
