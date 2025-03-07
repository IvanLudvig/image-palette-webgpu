@group(0) @binding(0) var tex: texture_2d<f32>;
@group(1) @binding(0) var<storage, read_write> histogram: array<atomic<u32>>;

const INDEX_BITS = 8u;

fn get_index(r: u32, g: u32, b: u32) -> u32 {
    return (r << (2 * INDEX_BITS)) + (g << INDEX_BITS) + b;
}

@compute @workgroup_size(16, 16)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let dimensions = textureDimensions(tex);
    let width = u32(dimensions.x);
    let height = u32(dimensions.y);

    let pointId = id.x + id.y * width;

    if (pointId >= width * height) {
        return;
    }
    
    let pixel = textureLoad(tex, id.xy, 0);

    let r = u32(pixel.r * 255.0);
    let g = u32(pixel.g * 255.0);
    let b = u32(pixel.b * 255.0);

    let bits_to_remove = 8u - INDEX_BITS;
    let ir = (r >> bits_to_remove) + 1u;
    let ig = (g >> bits_to_remove) + 1u;
    let ib = (b >> bits_to_remove) + 1u;
    let index = get_index(ir, ig, ib);
    
    atomicAdd(&histogram[index], 1u);
}
