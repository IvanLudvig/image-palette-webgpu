export async function setupBuildHistogram(device, source) {
    const histogramSize = 35937;
    const weightsBuffer = device.createBuffer({
        label: 'weights',
        size: histogramSize * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const momentsRBuffer = device.createBuffer({
        label: 'moments_r',
        size: histogramSize * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const momentsBBuffer = device.createBuffer({
        label: 'moments_b',
        size: histogramSize * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const momentsGBuffer = device.createBuffer({
        label: 'moments_g',
        size: histogramSize * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const momentsBuffer = device.createBuffer({
        label: 'moments',
        size: histogramSize * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
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

    const inputBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            texture: { sampleType: 'float', viewDimension: '2d' }
        }]
    });

    const buildHistogramBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        },
        {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }, {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }, {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }, {
            binding: 4,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }]
    });

    const inputBindGroup = device.createBindGroup({
        layout: inputBindGroupLayout,
        entries: [
            { binding: 0, resource: computeTexture.createView() }
        ]
    });

    const buildHistogramBindGroup = device.createBindGroup({
        layout: buildHistogramBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: weightsBuffer } },
            { binding: 1, resource: { buffer: momentsRBuffer } },
            { binding: 2, resource: { buffer: momentsGBuffer } },
            { binding: 3, resource: { buffer: momentsBBuffer } },
            { binding: 4, resource: { buffer: momentsBuffer } },
        ]
    });
    const buildHistogramPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [inputBindGroupLayout, buildHistogramBindGroupLayout]
    });

    const SHADER_BASE_URL = new URL('../shaders/', import.meta.url).href;
    const buildHistogramModule = device.createShaderModule({
        code: await fetch(SHADER_BASE_URL + 'build_histogram.wgsl').then(res => res.text())
    });

    const buildHistogramPipeline = device.createComputePipeline({
        layout: buildHistogramPipelineLayout,
        compute: { module: buildHistogramModule }
    });

    return {
        weightsBuffer,
        momentsRBuffer,
        momentsGBuffer,
        momentsBBuffer,
        momentsBuffer,
        buildHistogramPipeline,
        inputBindGroup,
        buildHistogramBindGroup,
        buildHistogramBindGroupLayout
    };
}
