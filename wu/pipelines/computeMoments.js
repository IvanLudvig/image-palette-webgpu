export async function setupComputeMoments(device, momentsBindGroupLayout) {
    const computeMomentsAxisBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'uniform' }
        }]
    });

    const computeMomentsAxisBindGroups = [];
    for (let axis = 0; axis < 3; axis++) {
        const axisUniformBuffer = device.createBuffer({
            size: Uint32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true
        });
        new Uint32Array(axisUniformBuffer.getMappedRange()).set([axis]);
        axisUniformBuffer.unmap();

        const bindGroup = device.createBindGroup({
            layout: computeMomentsAxisBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: axisUniformBuffer } }
            ]
        });
        computeMomentsAxisBindGroups.push(bindGroup);
    }

    const SHADER_BASE_URL = new URL('../shaders/', import.meta.url).href;
    const computeMomentsModule = device.createShaderModule({
        code: await fetch(SHADER_BASE_URL + 'compute_moments.wgsl').then(res => res.text())
    });
    const computeMomentsPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [momentsBindGroupLayout, computeMomentsAxisBindGroupLayout]
    });
    const computeMomentsPipeline = device.createComputePipeline({
        layout: computeMomentsPipelineLayout,
        compute: { module: computeMomentsModule }
    });

    return {
        computeMomentsAxisBindGroups,
        computeMomentsPipeline
    };
}