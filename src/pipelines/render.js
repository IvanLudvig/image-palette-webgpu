import params from '../params.js';

export async function setupRender(device, canvasFormat) {
    const centroidsBuffer = device.createBuffer({
        label: 'centroids-render',
        size: 3 * params.K * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const renderBindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: 'read-only-storage' }
        }]
    });

    const renderBindGroup = device.createBindGroup({
        layout: renderBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: centroidsBuffer } }
        ]
    });

    const renderPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [renderBindGroupLayout]
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
        centroidPipeline,
        renderBindGroup,
        centroidsBuffer
    };
} 