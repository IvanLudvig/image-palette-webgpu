export async function setupAssign(device, K, histogramBuffer, colorCount) {
    const countsUniformBuffer = device.createBuffer({
        size: Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(countsUniformBuffer, 0, new Uint32Array([K]));

    const centroidsBuffer = device.createBuffer({
        label: 'centroids',
        size: 3 * K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });

    const clustersBuffer = device.createBuffer({
        label: 'clusters',
        size: colorCount * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const SHADER_BASE_URL = new URL('../shaders/', import.meta.url).href;
    const assignModule = device.createShaderModule({
        code: await fetch(SHADER_BASE_URL + 'assign.wgsl').then(res => res.text())
    });

    const computeBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' }
        },
        {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'uniform' }
        }]
    });

    const computeBindGroup = device.createBindGroup({
        layout: computeBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: histogramBuffer } },
            { binding: 1, resource: { buffer: countsUniformBuffer } }
        ]
    });

    const assignBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' }
        },
        {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }]
    });

    const assignBindGroup = device.createBindGroup({
        layout: assignBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: centroidsBuffer } },
            { binding: 1, resource: { buffer: clustersBuffer } }
        ]
    });
    const assignPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [computeBindGroupLayout, assignBindGroupLayout]
    });

    const assignPipeline = await device.createComputePipelineAsync({
        layout: assignPipelineLayout,
        compute: { module: assignModule }
    });

    return {
        centroidsBuffer,
        clustersBuffer,
        assignPipeline,
        computeBindGroup,
        computeBindGroupLayout,
        assignBindGroup
    };
}