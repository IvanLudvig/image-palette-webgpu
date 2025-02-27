export async function setupAssign(device, source, K) {
    const canvas = new OffscreenCanvas(source.width, source.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0);
    const imageData = ctx.getImageData(0, 0, source.width, source.height).data;
    const colorHistogram = new Map();
    for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const key = (r << 16) | (g << 8) | b;
        colorHistogram.set(key, (colorHistogram.get(key) ?? 0) + 1);
    }

    const colorCount = colorHistogram.size;
    const histogramArray = new Float32Array(colorCount * 4);
    let i = 0;
    for (const [key, count] of colorHistogram) {
        const r = (key >> 16) & 0xFF;
        const g = (key >> 8) & 0xFF;
        const b = key & 0xFF;

        histogramArray[i * 4] = r / 255;
        histogramArray[i * 4 + 1] = g / 255;
        histogramArray[i * 4 + 2] = b / 255;
        histogramArray[i * 4 + 3] = count;
        i++;
    }

    const countsUniformBuffer = device.createBuffer({
        size: 2 * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(countsUniformBuffer, 0, new Uint32Array([K, colorCount]));

    const histogramBuffer = device.createBuffer({
        label: 'histogram',
        size: histogramArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(histogramBuffer, 0, histogramArray);

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

    const assignPipeline = device.createComputePipeline({
        layout: assignPipelineLayout,
        compute: { module: assignModule }
    });

    return {
        colorCount,
        centroidsBuffer,
        clustersBuffer,
        assignPipeline,
        computeBindGroup,
        computeBindGroupLayout,
        assignBindGroup
    };
}