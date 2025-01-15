@group(0) @binding(0) var<storage> histogram: array<f32>;
@group(0) @binding(1) var<uniform> color_count: u32;
@group(0) @binding(2) var<storage, read_write> centroids: array<f32>;
@group(0) @binding(3) var<storage, read_write> clusters: array<u32>;

@compute @workgroup_size(8)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let centroid = id.x;
    var sum = vec3f(0);
    var num = u32(0);

    for (var i = 0; i < i32(color_count); i++) {
        if (clusters[i] == centroid) {
            let pixel = vec3f(histogram[i * 4], histogram[i * 4 + 1], histogram[i * 4 + 2]);
            let count = u32(histogram[i * 4 + 3]);
            sum += pixel * f32(count);
            num += count;
        }
    }

    centroids[3*centroid] = sum.x / f32(num);
    centroids[3*centroid + 1] = sum.y / f32(num);
    centroids[3*centroid + 2] = sum.z / f32(num);
}
