import params from '../params.js';

export async function setupRender(device, canvasFormat, source) {
    const N = params.imgSize[0] * params.imgSize[1];

    const centroidsBuffer = device.createBuffer({
        label: 'centroids-render',
        size: 3 * params.K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const clustersBuffer = device.createBuffer({
        label: 'clusters-render',
        size: 4 * N,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const renderModule = device.createShaderModule({
        code: await fetch('src/shaders/render.wgsl').then(res => res.text())
    });

    const texture = device.createTexture({
        format: 'rgba8unorm',
        size: [source.width, source.height],
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture(
        { source, flipY: true },
        { texture },
        { width: source.width, height: source.height }
    );

    const sampler = device.createSampler({
        addressModeU: 'clamp-to-edge',
        addressMoveV: 'clamp-to-edge',
        magFilter: 'nearest'
    });

    const renderBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            texture: { sampleType: 'float', viewDimension: '2d' }
        }, {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            sampler: {}
        }, {
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: 'read-only-storage' }
        }, {
            binding: 3,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: 'read-only-storage' }
        }]
    });

    const renderBindGroup = device.createBindGroup({
        layout: renderBindGroupLayout,
        entries: [
            { binding: 0, resource: texture.createView() },
            { binding: 1, resource: sampler },
            { binding: 2, resource: { buffer: centroidsBuffer } },
            { binding: 3, resource: { buffer: clustersBuffer } }
        ]
    });

    const renderPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [renderBindGroupLayout]
    });

    const renderPipeline = device.createRenderPipeline({
        layout: renderPipelineLayout,
        vertex: { module: renderModule },
        fragment: {
            module: renderModule,
            targets: [{ format: canvasFormat }]
        }
    });

    const centroidRenderModule = device.createShaderModule({
        code: await fetch('src/shaders/centroid-render.wgsl').then(res => res.text())
    });

    const centroidPipeline = device.createRenderPipeline({
        layout: renderPipelineLayout,
        vertex: { module: centroidRenderModule },
        fragment: {
            module: centroidRenderModule,
            targets: [{ format: canvasFormat }]
        }
    });

    return {
        renderPipeline,
        centroidPipeline,
        renderBindGroup,
        centroidsBuffer,
        clustersBuffer
    };
} 