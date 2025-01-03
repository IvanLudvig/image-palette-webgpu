@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> centroids: array<f32>;
@group(0) @binding(2) var<storage, read_write> clusters: array<u32>;

fn dist(a: vec3f, b: vec3f) -> f32 {
    return pow((a.x - b.x), 2) + pow((a.y - b.y), 2) + pow((a.z - b.z), 2);
}

@compute @workgroup_size(16, 16)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let pixel = textureLoad(tex, id.xy, 0);

    let pointId = id.x + id.y * 128;
    var min_dist = -1.;
    var closest = 0;
    let pos = vec3f(pixel.r, pixel.g, pixel.b);

    for (var i = 0; i < 8; i++) {
        let centroid = vec3f(centroids[3*i], centroids[3*i + 1], centroids[3*i + 2]);
        let d = dist(pos, centroid);
        if (min_dist == -1 || d < min_dist){
            closest = i;
            min_dist = d;
        }
    }

    clusters[pointId] = u32(closest);
}
