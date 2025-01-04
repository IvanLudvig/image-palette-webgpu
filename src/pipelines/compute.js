import params from '../params.js';

export async function setupCompute(device, source) {
    const N = source.width * source.height;

    const centroids = new Float32Array(3 * params.K);
    for (let i = 0; i < 3 * params.K; i++) {
        centroids[i] = Math.random();
    }

    const centroidsBuffer = device.createBuffer({
        label: 'centroids-compute',
        size: centroids.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });
    device.queue.writeBuffer(centroidsBuffer, 0, centroids);

    const clustersBuffer = device.createBuffer({
        label: 'clusters-compute',
        size: 4 * N,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    const assignModule = device.createShaderModule({
        code: await fetch('src/shaders/assign.wgsl').then(res => res.text())
    });
    const updateModule = device.createShaderModule({
        code: await fetch('src/shaders/update.wgsl').then(res => res.text())
    });

    const computeTexture = device.createTexture({
        format: 'rgba8unorm',
        size: [source.width, source.height],
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT |
            GPUTextureUsage.SAMPLED
    });

    device.queue.copyExternalImageToTexture(
        { source, flipY: true },
        { texture: computeTexture },
        { width: source.width, height: source.height }
    );

    const computeBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            texture: { sampleType: 'float', viewDimension: '2d' }
        }, {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }, {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }]
    });

    const computeBindGroup = device.createBindGroup({
        layout: computeBindGroupLayout,
        entries: [
            { binding: 0, resource: computeTexture.createView() },
            { binding: 1, resource: { buffer: centroidsBuffer } },
            { binding: 2, resource: { buffer: clustersBuffer } }
        ]
    });
    const computePipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [computeBindGroupLayout]
    });

    const updatePipeline = device.createComputePipeline({
        layout: computePipelineLayout,
        compute: { module: updateModule }
    });
    const assignPipeline = device.createComputePipeline({
        layout: computePipelineLayout,
        compute: { module: assignModule }
    });

    return {
        centroidsBuffer,
        clustersBuffer,
        assignPipeline,
        updatePipeline,
        computeBindGroup
    };
} 