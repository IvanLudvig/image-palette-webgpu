struct Counts {
    centroids: u32
};

const INDEX_BITS = 8u;
const MAX_VALUE = (1u << INDEX_BITS) - 1u;
const MAX_VALUE_F32 = f32(MAX_VALUE);
const COLOR_COUNT = 1u << (INDEX_BITS * 3u);

@group(0) @binding(0) var<storage, read> histogram: array<u32>;
@group(0) @binding(1) var<uniform> counts: Counts;
@group(1) @binding(0) var<storage, read_write> centroids: array<f32>;
@group(1) @binding(1) var<storage, read> clusters: array<u32>;
@group(1) @binding(2) var<storage, read_write> centroids_delta: array<f32>;

fn dist(a: vec3f, b: vec3f) -> f32 {
    return pow((a.x - b.x), 2) + pow((a.y - b.y), 2) + pow((a.z - b.z), 2);
}

fn get_rgb(index: u32) -> vec3f {
    let r = (index >> (2 * INDEX_BITS)) & MAX_VALUE;
    let g = (index >> INDEX_BITS) & MAX_VALUE;
    let b = index & MAX_VALUE;

    return vec3f(f32(r) / MAX_VALUE_F32, f32(g) / MAX_VALUE_F32, f32(b) / MAX_VALUE_F32);
}


@compute @workgroup_size(16)
fn cs(@builtin(global_invocation_id) id: vec3u) {
    let centroid = id.x;

    if (centroid >= counts.centroids) {
        return;
    }

    var sum = vec3f(0);
    var count = 0u;

    for (var i = 0u; i < COLOR_COUNT; i++) {
        if (histogram[i] > 0u && clusters[i] == centroid) {
            let pixel = get_rgb(i);
            let pixel_count = histogram[i];
            sum += pixel * f32(pixel_count);
            count += pixel_count;
        }
    }

    if (count > 0u) {
        let old_pos = vec3f(centroids[3*centroid], centroids[3*centroid + 1], centroids[3*centroid + 2]);
        let new_pos = sum / f32(count);

        centroids[3*centroid] = new_pos.x;
        centroids[3*centroid + 1] = new_pos.y;
        centroids[3*centroid + 2] = new_pos.z;

        let d = dist(old_pos, new_pos);
        centroids_delta[centroid] = d;
    } else {
        centroids[3*centroid] = -1.0;
        centroids[3*centroid + 1] = -1.0;
        centroids[3*centroid + 2] = -1.0;
        centroids_delta[centroid] = 0.0;
    }
}
