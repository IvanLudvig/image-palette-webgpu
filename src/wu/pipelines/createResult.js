import params from '../../params.js';

export async function setupCreateResult(device, momentsBindGroupLayout, cubesBuffer, totalCubesNumUniformBuffer) {
    const cubesResultBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' }
        },{
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'uniform' }
        }]
    });
    const cubesResultBindGroup = device.createBindGroup({
        layout: cubesResultBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: cubesBuffer } },
            { binding: 1, resource: { buffer: totalCubesNumUniformBuffer } }
        ]
    });

    const resultsBuffer = device.createBuffer({
        size: 3 * params.K * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const resultsBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }]
    });
    const resultsBindGroup = device.createBindGroup({
        layout: resultsBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: resultsBuffer } }
        ]
    });

    const createResultModule = device.createShaderModule({
        code: await fetch('src/wu/shaders/create_result.wgsl').then(res => res.text())
    });
    const createResultPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [momentsBindGroupLayout, cubesResultBindGroupLayout, resultsBindGroupLayout]
    });
    const createResultPipeline = device.createComputePipeline({
        layout: createResultPipelineLayout,
        compute: { module: createResultModule }
    });

    return {
        resultsBuffer,
        cubesResultBindGroup,
        resultsBindGroup,
        createResultPipeline
    };
}