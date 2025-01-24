export async function setupComputeMoments(device, momentsBindGroupLayout) {
    const axisUniformBuffer = device.createBuffer({
        size: Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const computeMomentsAxisBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'uniform' }
        }]
    });
    const computeMomentsAxisBindGroup = device.createBindGroup({
        layout: computeMomentsAxisBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: axisUniformBuffer } }
        ]
    });
    const computeMomentsModule = device.createShaderModule({
        code: await fetch('src/shaders/compute_moments.wgsl').then(res => res.text())
    });
    const computeMomentsPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [momentsBindGroupLayout, computeMomentsAxisBindGroupLayout]
    });
    const computeMomentsPipeline = device.createComputePipeline({
        layout: computeMomentsPipelineLayout,
        compute: { module: computeMomentsModule }
    });

    return {
        axisUniformBuffer,
        computeMomentsAxisBindGroup,
        computeMomentsPipeline
    };
}