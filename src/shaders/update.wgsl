@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> centroids: array<f32>;
@group(0) @binding(2) var<storage, read_write> clusters: array<u32>;

@compute @workgroup_size(8)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let centroid = id.x;
    var sum = vec3f(0);
    var num = 0;

    for (var i = 0; i < 128 * 128; i++) {
        if (clusters[i] == centroid) {
            let pixel = textureLoad(tex, vec2u(u32(i % 128), u32(f32(i) / 128.)), 0);
            sum += vec3f(pixel.r, pixel.g, pixel.b);
            num += 1;
        }
    }

    centroids[3*centroid] = sum.x / f32(num);
    centroids[3*centroid + 1] = sum.y / f32(num);
    centroids[3*centroid + 2] = sum.z / f32(num);
}
