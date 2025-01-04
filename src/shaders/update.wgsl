@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> centroids: array<f32>;
@group(0) @binding(2) var<storage, read_write> clusters: array<u32>;

@compute @workgroup_size(8)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let centroid = id.x;
    var sum = vec3f(0);
    var num = 0;

    let dimensions = textureDimensions(tex);
    let width = u32(dimensions.x);
    let height = u32(dimensions.y);

    for (var i = 0; i < i32(width * height); i++) {
        if (clusters[i] == centroid) {
            let pixel = textureLoad(tex, vec2u(u32(i % i32(width)), u32(f32(i) / f32(width))), 0);
            sum += vec3f(pixel.r, pixel.g, pixel.b);
            num += 1;
        }
    }

    centroids[3*centroid] = sum.x / f32(num);
    centroids[3*centroid + 1] = sum.y / f32(num);
    centroids[3*centroid + 2] = sum.z / f32(num);
}
