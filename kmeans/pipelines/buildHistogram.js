export async function setupBuildHistogram(device, source, colorCount) {
    const histogramBuffer = device.createBuffer({
        label: 'histogram',
        size: colorCount * Uint32Array.BYTES_PER_ELEMENT,
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

    const histogramBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
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

    const histogramBindGroup = device.createBindGroup({
        layout: histogramBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: histogramBuffer } }
        ]
    });
    const histogramPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [inputBindGroupLayout, histogramBindGroupLayout]
    });

    const SHADER_BASE_URL = new URL('../shaders/', import.meta.url).href;
    const histogramModule = device.createShaderModule({
        code: await fetch(SHADER_BASE_URL + 'build_histogram.wgsl').then(res => res.text())
    });

    const histogramPipeline = await device.createComputePipelineAsync({
        layout: histogramPipelineLayout,
        compute: { module: histogramModule }
    });

    return {
        histogramBuffer,
        histogramPipeline,
        inputBindGroup,
        histogramBindGroup
    };
}
