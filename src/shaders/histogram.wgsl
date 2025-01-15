@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> histogram: array<atomic<u32>>;

@compute @workgroup_size(8, 8)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let dimensions = textureDimensions(tex);
    let width = u32(dimensions.x);
    let height = u32(dimensions.y);

    let pointId = id.x + id.y * width;

    if (pointId >= width * height) {
        return;
    }
    
    let pixel = textureLoad(tex, id.xy, 0);

    let r = u32(color.r * 255.0);
    let g = u32(color.g * 255.0);
    let b = u32(color.b * 255.0);
    let index = (r * 256u * 256u) + (g * 256u) + b;
    
    atomicAdd(&histogram[index], 1u);
}
