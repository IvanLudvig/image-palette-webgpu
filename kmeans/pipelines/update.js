export async function setupUpdate(device, K, computeBindGroupLayout, centroidsBuffer, clustersBuffer) {
    const centroidsDeltaBuffer = device.createBuffer({
        label: 'centroids-delta',
        size: K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const SHADER_BASE_URL = new URL('../shaders/', import.meta.url).href;
    const updateModule = device.createShaderModule({
        code: await fetch(SHADER_BASE_URL + 'update.wgsl').then(res => res.text())
    });

    const updateBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        },
        {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' }
        },
        {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }]
    });

    const updateBindGroup = device.createBindGroup({
        layout: updateBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: centroidsBuffer } },
            { binding: 1, resource: { buffer: clustersBuffer } },
            { binding: 2, resource: { buffer: centroidsDeltaBuffer } }
        ]
    });
    const updatePipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [computeBindGroupLayout, updateBindGroupLayout]
    });

    const updatePipeline = device.createComputePipeline({
        layout: updatePipelineLayout,
        compute: { module: updateModule }
    });

    return {
        centroidsDeltaBuffer,
        updatePipeline,
        updateBindGroup
    };
}