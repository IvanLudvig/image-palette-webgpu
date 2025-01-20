struct Counts {
    centroids: u32,
    colors: u32
};

@group(0) @binding(0) var<storage> histogram: array<f32>;
@group(0) @binding(1) var<uniform> counts: Counts;
@group(0) @binding(2) var<storage, read_write> centroids: array<f32>;
@group(0) @binding(3) var<storage, read_write> clusters: array<u32>;
@group(0) @binding(4) var<storage, read_write> centroids_delta: array<f32>;

fn dist(a: vec3f, b: vec3f) -> f32 {
    return sqrt(pow((a.x - b.x), 2) + pow((a.y - b.y), 2) + pow((a.z - b.z), 2));
}

@compute @workgroup_size(8)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let centroid = id.x;

    if (centroid >= counts.centroids) {
        return;
    }

    var sum = vec3f(0);
    var count = 0u;

    for (var i = 0u; i < counts.colors; i++) {
        if (clusters[i] == centroid) {
            let pixel = vec3f(histogram[i * 4], histogram[i * 4 + 1], histogram[i * 4 + 2]);
            let pixel_count = u32(histogram[i * 4 + 3]);
            sum += pixel * f32(pixel_count);
            count += pixel_count;
        }
    }

    if (count > 0u) {
        let old_pos = vec3f(centroids[3*centroid], centroids[3*centroid + 1], centroids[3*centroid + 2]);

        centroids[3*centroid] = sum.x / f32(count);
        centroids[3*centroid + 1] = sum.y / f32(count);
        centroids[3*centroid + 2] = sum.z / f32(count);

        let new_pos = vec3f(centroids[3*centroid], centroids[3*centroid + 1], centroids[3*centroid + 2]);
        let d = dist(old_pos, new_pos);
        centroids_delta[centroid] = d;
    } else {
        centroids[3*centroid] = 0.0;
        centroids[3*centroid + 1] = 0.0;
        centroids[3*centroid + 2] = 0.0;
        centroids_delta[centroid] = 1.0;
    }
}
